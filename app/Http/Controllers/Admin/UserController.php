<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateUserRoleRequest;
use App\Http\Requests\UserIndexRequest;
use App\Models\User;
use App\Services\UserRoleService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function __construct(
        private readonly UserRoleService $userRoles,
    ) {}

    public function index(UserIndexRequest $request): Response
    {
        $this->authorize('viewAny', User::class);

        return Inertia::render('admin/users/index', [
            'users' => $this->userRoles->paginate($request->validated('search'), $request->role()),
            'roles' => $this->userRoles->roleOptions(),
            'filters' => $request->only(['search', 'role']),
        ]);
    }

    public function updateRole(UpdateUserRoleRequest $request, User $user): RedirectResponse
    {
        $this->authorize('updateRole', $user);

        $this->userRoles->changeRole($user, $request->role());

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':name is now :role.', [
            'name' => $user->name,
            'role' => $request->role()->label(),
        ])]);

        return back();
    }
}
