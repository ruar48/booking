<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileDeleteRequest;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use App\Models\Player;
<<<<<<< Updated upstream
use App\Services\PlayerService;
=======
>>>>>>> Stashed changes
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function __construct(
        private readonly PlayerService $playerService,
    ) {}

    /**
     * Show the user's profile settings page.
     */
    public function edit(Request $request): Response
    {
        $player = $request->user()->players()->first();

        return Inertia::render('settings/profile', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
<<<<<<< Updated upstream
            'birthdate' => $player?->birthdate?->toDateString(),
            'gender' => $player?->gender,
            'avatarUrl' => $request->user()->avatar
                ? Storage::disk('avatars')->url($request->user()->avatar)
                : null,
=======
            'birthdate' => $request->user()->players()->first()?->birthdate?->toDateString(),
>>>>>>> Stashed changes
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $request->user()->fill(collect($validated)->only(['name', 'email'])->all());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

<<<<<<< Updated upstream
        if ($request->hasFile('avatar')) {
            $this->playerService->uploadAvatar($request->user(), $request->file('avatar'));
        }

        Player::query()->updateOrCreate(
            ['user_id' => $request->user()->id],
            [
                'birthdate' => $validated['birthdate'] ?? null,
                'gender' => $validated['gender'] ?? null,
            ],
=======
        Player::query()->updateOrCreate(
            ['user_id' => $request->user()->id],
            ['birthdate' => $validated['birthdate'] ?? null],
>>>>>>> Stashed changes
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Profile updated.')]);

        return to_route('profile.edit');
    }

    /**
     * Delete the user's profile.
     */
    public function destroy(ProfileDeleteRequest $request): RedirectResponse
    {
        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
