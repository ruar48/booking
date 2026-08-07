<?php

namespace App\Http\Controllers;

use App\Contracts\Repositories\SaleRepositoryInterface;
use App\Models\Sale;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SaleController extends Controller
{
    public function __construct(
        private readonly SaleRepositoryInterface $saleRepository,
    ) {}

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Sale::class);

        return Inertia::render('pos/sales/index', [
            'sales' => $this->saleRepository->paginate(
                status: $request->string('status')->value() ?: null,
            ),
            'filters' => $request->only(['status']),
        ]);
    }

    public function show(Sale $sale): Response
    {
        $this->authorize('view', $sale);

        $sale->load(['items.product', 'payments', 'cashier', 'customer']);

        return Inertia::render('pos/sales/show', [
            'sale' => $sale,
        ]);
    }
}
