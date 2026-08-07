<?php

namespace App\Repositories;

use App\Contracts\Repositories\ProductRepositoryInterface;
use App\Contracts\Repositories\SaleRepositoryInterface;
use App\Enums\PaymentStatus;
use App\Enums\SaleStatus;
use App\Enums\StockMovementType;
use App\Exceptions\InsufficientStockException;
use App\Exceptions\InvalidSaleStateException;
use App\Models\Product;
use App\Models\Sale;
use App\Models\User;
use App\Services\PaymentService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class SaleRepository implements SaleRepositoryInterface
{
    public function __construct(
        private readonly ProductRepositoryInterface $productRepository,
        private readonly PaymentService $paymentService,
    ) {}

    public function paginate(?string $status = null, int $perPage = 15): LengthAwarePaginator
    {
        return Sale::query()
            ->with(['cashier', 'customer'])
            ->when(
                filled($status),
                fn ($query) => $query->where('status', $status),
            )
            ->latest()
            ->paginate($perPage);
    }

    public function find(int $id): Sale
    {
        return Sale::query()->findOrFail($id);
    }

    /**
     * @param  array<int, array{product_id: int, quantity: int}>  $cartItems
     * @param  array<string, mixed>  $meta
     */
    public function checkout(array $cartItems, array $meta): Sale
    {
        return DB::transaction(function () use ($cartItems, $meta): Sale {
            /** @var User $cashier */
            $cashier = $meta['cashier'];

            $productIds = array_column($cartItems, 'product_id');

            $products = Product::query()
                ->whereIn('id', $productIds)
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            $subtotal = 0;
            $lines = [];

            foreach ($cartItems as $cartItem) {
                $product = $products->get($cartItem['product_id']);

                if ($product === null) {
                    throw new InsufficientStockException("Product #{$cartItem['product_id']} could not be found.");
                }

                $quantity = (int) $cartItem['quantity'];

                if ($product->stock_quantity < $quantity) {
                    throw new InsufficientStockException("Insufficient stock for \"{$product->name}\" (available: {$product->stock_quantity}, requested: {$quantity}).");
                }

                $unitPrice = (float) $product->price;
                $lineTotal = round($unitPrice * $quantity, 2);
                $subtotal += $lineTotal;

                $lines[] = [
                    'product' => $product,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'line_total' => $lineTotal,
                ];
            }

            $discount = (float) ($meta['discount'] ?? 0);
            $tax = (float) ($meta['tax'] ?? 0);
            $total = round($subtotal - $discount + $tax, 2);

            $sale = Sale::query()->create([
                'cashier_id' => $cashier->id,
                'customer_id' => $meta['customer_id'] ?? null,
                'invoice_number' => $this->generateSaleInvoiceNumber(),
                'subtotal' => round($subtotal, 2),
                'discount' => $discount,
                'tax' => $tax,
                'total' => $total,
                'status' => SaleStatus::Completed,
                'notes' => $meta['notes'] ?? null,
            ]);

            foreach ($lines as $line) {
                $sale->items()->create([
                    'product_id' => $line['product']->id,
                    'product_name' => $line['product']->name,
                    'quantity' => $line['quantity'],
                    'unit_price' => $line['unit_price'],
                    'line_total' => $line['line_total'],
                ]);

                $this->productRepository->adjustStock(
                    $line['product'],
                    -$line['quantity'],
                    StockMovementType::Sale,
                    $cashier,
                    null,
                    $sale,
                );
            }

            $payeeUserId = $meta['customer_id'] ?? $cashier->id;

            $sale->payments()->create([
                'user_id' => $payeeUserId,
                'invoice_number' => $this->paymentService->generateInvoiceNumber(),
                'amount' => $total,
                'currency' => 'USD',
                'status' => PaymentStatus::Paid,
                'payment_method' => $meta['payment_method'] ?? null,
                'paid_at' => now(),
                'notes' => $meta['notes'] ?? null,
            ]);

            return $sale->fresh(['items', 'payments']);
        });
    }

    public function void(Sale $sale, User $actor): Sale
    {
        return DB::transaction(function () use ($sale, $actor): Sale {
            /** @var Sale $locked */
            $locked = Sale::query()->whereKey($sale->id)->lockForUpdate()->firstOrFail();

            if ($locked->status !== SaleStatus::Completed) {
                throw new InvalidSaleStateException('Only completed sales can be voided.');
            }

            $locked->load('items.product');

            foreach ($locked->items as $item) {
                $this->productRepository->adjustStock(
                    $item->product,
                    $item->quantity,
                    StockMovementType::Return,
                    $actor,
                    'Sale voided',
                    $locked,
                );
            }

            $locked->status = SaleStatus::Voided;
            $locked->save();

            $locked->payments()->update([
                'status' => PaymentStatus::Refunded,
            ]);

            return $locked->fresh(['items', 'payments']);
        });
    }

    /**
     * @return array<string, mixed>
     */
    public function salesReport(Carbon $start, Carbon $end): array
    {
        $salesQuery = Sale::query()
            ->where('status', SaleStatus::Completed->value)
            ->whereBetween('created_at', [$start, $end]);

        $totalRevenue = (clone $salesQuery)->sum('total');
        $totalSalesCount = (clone $salesQuery)->count();

        $topProducts = DB::table('sale_items')
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->where('sales.status', SaleStatus::Completed->value)
            ->whereBetween('sales.created_at', [$start, $end])
            ->groupBy('sale_items.product_id', 'sale_items.product_name')
            ->orderByDesc(DB::raw('SUM(sale_items.line_total)'))
            ->limit(10)
            ->get([
                'sale_items.product_id',
                'sale_items.product_name',
                DB::raw('SUM(sale_items.quantity) as quantity_sold'),
                DB::raw('SUM(sale_items.line_total) as revenue'),
            ])
            ->map(fn ($row) => [
                'product_id' => (int) $row->product_id,
                'product_name' => $row->product_name,
                'quantity_sold' => (int) $row->quantity_sold,
                'revenue' => (float) $row->revenue,
            ])
            ->all();

        $revenueByDay = DB::table('sales')
            ->where('status', SaleStatus::Completed->value)
            ->whereBetween('created_at', [$start, $end])
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy(DB::raw('DATE(created_at)'))
            ->get([
                DB::raw('DATE(created_at) as date'),
                DB::raw('SUM(total) as revenue'),
            ])
            ->map(fn ($row) => [
                'date' => (string) $row->date,
                'revenue' => (float) $row->revenue,
            ])
            ->all();

        return [
            'total_revenue' => (float) $totalRevenue,
            'total_sales_count' => $totalSalesCount,
            'top_products' => $topProducts,
            'revenue_by_day' => $revenueByDay,
        ];
    }

    private function generateSaleInvoiceNumber(): string
    {
        $prefix = 'SALE-'.now()->format('Ymd');
        $latest = Sale::query()
            ->where('invoice_number', 'like', $prefix.'%')
            ->orderByDesc('invoice_number')
            ->value('invoice_number');

        $sequence = 1;

        if ($latest !== null) {
            $sequence = (int) substr($latest, -4) + 1;
        }

        return sprintf('%s-%04d', $prefix, $sequence);
    }
}
