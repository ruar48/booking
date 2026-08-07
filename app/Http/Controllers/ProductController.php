<?php

namespace App\Http\Controllers;

use App\Contracts\Repositories\ProductRepositoryInterface;
use App\Enums\StockMovementType;
use App\Exceptions\InsufficientStockException;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function __construct(
        private readonly ProductRepositoryInterface $productRepository,
    ) {}

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Product::class);

        $lowStockOnly = $request->boolean('low_stock');

        return Inertia::render('inventory/index', [
            'products' => $this->productRepository->paginate(
                search: $request->string('search')->value() ?: null,
                lowStockOnly: $lowStockOnly,
            ),
            'filters' => [
                'search' => $request->string('search')->value() ?: null,
                'low_stock' => $lowStockOnly,
            ],
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Product::class);

        return Inertia::render('inventory/create');
    }

    public function store(StoreProductRequest $request): RedirectResponse
    {
        $product = $this->productRepository->create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Product created.')]);

        return to_route('products.edit', $product);
    }

    public function edit(Product $product): Response
    {
        $this->authorize('update', $product);

        return Inertia::render('inventory/edit', [
            'product' => $product,
        ]);
    }

    public function update(UpdateProductRequest $request, Product $product): RedirectResponse
    {
        $this->productRepository->update($product, $request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Product updated.')]);

        return to_route('products.edit', $product);
    }

    public function destroy(Product $product): RedirectResponse
    {
        $this->authorize('delete', $product);

        $this->productRepository->delete($product);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Product deleted.')]);

        return to_route('products.index');
    }

    public function adjustStock(Request $request, Product $product): RedirectResponse
    {
        $this->authorize('adjustStock', $product);

        $validated = $request->validate([
            'delta' => ['required', 'integer', 'not_in:0'],
            'reason' => ['nullable', 'string', 'max:255'],
        ]);

        try {
            $this->productRepository->adjustStock(
                $product,
                $validated['delta'],
                StockMovementType::Adjustment,
                $request->user(),
                $validated['reason'] ?? null,
            );

            Inertia::flash('toast', ['type' => 'success', 'message' => __('Stock adjusted.')]);
        } catch (InsufficientStockException $exception) {
            Inertia::flash('toast', ['type' => 'error', 'message' => $exception->getMessage()]);
        }

        return back();
    }
}
