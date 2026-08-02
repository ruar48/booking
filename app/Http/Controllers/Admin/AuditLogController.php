<?php

namespace App\Http\Controllers\Admin;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AuditLogController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()->hasRole(Role::SuperAdmin->value), 403);

        $logs = AuditLog::query()
            ->with('user:id,name,email')
            ->when(
                $request->filled('action'),
                fn ($query) => $query->where('action', $request->input('action')),
            )
            ->when(
                $request->filled('user_id'),
                fn ($query) => $query->where('user_id', $request->integer('user_id')),
            )
            ->latest()
            ->paginate();

        return Inertia::render('admin/audit-logs/index', [
            'logs' => $logs,
            'filters' => $request->only(['action', 'user_id']),
        ]);
    }
}
