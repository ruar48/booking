<?php

namespace App\Http\Controllers;

use App\Contracts\Repositories\ProductRepositoryInterface;
use App\Contracts\Repositories\SaleRepositoryInterface;
use App\Enums\PaymentMethod;
use App\Enums\ProductStatus;
use App\Exceptions\InsufficientStockException;
use App\Exceptions\InvalidSaleStateException;
use App\Http\Requests\StoreSaleRequest;
use App\Http\Requests\VoidSaleRequest;
use App\Models\Product;
use App\Models\Sale;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PosController extends Controller
{
    public function __construct(
        private readonly SaleRepositoryInterface $saleRepository,
        private readonly ProductRepositoryInterface $productRepository,
    ) {}

    public function checkout(Request $request): Response
    {
        $this->authorize('create', Sale::class);

        $clubId = $request->integer('club_id') ?: null;

        $products = Product::query()
            ->when(
                $clubId !== null,
                fn ($query) => $query->where('club_id', $clubId),
            )
            ->where('status', ProductStatus::Active->value)
            ->orderBy('name')
            ->get();

        return Inertia::render('pos/checkout', [
            'products' => $products,
            'paymentMethods' => collect(PaymentMethod::cases())->map(fn (PaymentMethod $method) => [
                'value' => $method->value,
                'label' => $method->label(),
            ])->all(),
            'filters' => [
                'club_id' => $clubId,
            ],
        ]);
    }

    public function store(StoreSaleRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        try {
            $sale = $this->saleRepository->checkout($validated['items'], [
                'club_id' => $validated['club_id'],
                'cashier' => $request->user(),
                'customer_id' => $validated['customer_id'] ?? null,
                'payment_method' => $validated['payment_method'],
                'discount' => $validated['discount'] ?? 0,
                'tax' => $validated['tax'] ?? 0,
                'notes' => $validated['notes'] ?? null,
            ]);
        } catch (InsufficientStockException $exception) {
            return back()->withErrors(['items' => $exception->getMessage()]);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Sale completed.')]);

        return to_route('pos.sales.show', $sale);
    }

    public function void(VoidSaleRequest $request, Sale $sale): RedirectResponse
    {
        try {
            $this->saleRepository->void($sale, $request->user());

            Inertia::flash('toast', ['type' => 'success', 'message' => __('Sale voided.')]);
        } catch (InvalidSaleStateException $exception) {
            Inertia::flash('toast', ['type' => 'error', 'message' => $exception->getMessage()]);
        }

        return back();
    }
}
