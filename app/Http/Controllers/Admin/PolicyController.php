<?php

namespace App\Http\Controllers\Admin;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Models\Policy;
use App\Services\AuditLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PolicyController extends Controller
{
    public function __construct(
        private readonly AuditLogService $auditLogService,
    ) {}

    public function index(Request $request): Response
    {
        abort_unless($request->user()->hasRole(Role::SuperAdmin->value), 403);

        $policies = Policy::query()
            ->with('updatedBy:id,name')
            ->orderBy('sort_order')
            ->orderBy('title')
            ->get();

        return Inertia::render('admin/policies/index', [
            'policies' => $policies,
        ]);
    }

    public function create(Request $request): Response
    {
        abort_unless($request->user()->hasRole(Role::SuperAdmin->value), 403);

        return Inertia::render('admin/policies/create');
    }

    public function store(Request $request): RedirectResponse
    {
        abort_unless($request->user()->hasRole(Role::SuperAdmin->value), 403);

        $validated = $this->validated($request);

        $policy = Policy::query()->create([
            ...$validated,
            'updated_by' => $request->user()->id,
        ]);

        $this->auditLogService->log('policy.created', $policy, null, $policy->toArray());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Policy created.')]);

        return to_route('admin.policies.index');
    }

    public function edit(Request $request, Policy $policy): Response
    {
        abort_unless($request->user()->hasRole(Role::SuperAdmin->value), 403);

        return Inertia::render('admin/policies/edit', [
            'policy' => $policy,
        ]);
    }

    public function update(Request $request, Policy $policy): RedirectResponse
    {
        abort_unless($request->user()->hasRole(Role::SuperAdmin->value), 403);

        $validated = $this->validated($request);
        $old = $policy->toArray();

        $policy->update([
            ...$validated,
            'updated_by' => $request->user()->id,
        ]);

        $this->auditLogService->log('policy.updated', $policy, $old, $policy->fresh()->toArray());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Policy updated.')]);

        return to_route('admin.policies.index');
    }

    public function destroy(Request $request, Policy $policy): RedirectResponse
    {
        abort_unless($request->user()->hasRole(Role::SuperAdmin->value), 403);

        $old = $policy->toArray();
        $policy->delete();

        $this->auditLogService->log('policy.deleted', null, $old, null);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Policy deleted.')]);

        return to_route('admin.policies.index');
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request): array
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'placement' => ['required', 'string', 'in:checkout,general'],
            'body' => ['required', 'string'],
            'is_active' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        $validated['is_active'] = $validated['is_active'] ?? true;
        $validated['sort_order'] = $validated['sort_order'] ?? 0;

        return $validated;
    }
}
