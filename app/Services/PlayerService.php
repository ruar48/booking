<?php

namespace App\Services;

use App\Contracts\Repositories\PlayerRepositoryInterface;
use App\Models\Player;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class PlayerService
{
    public function __construct(
        private readonly PlayerRepositoryInterface $playerRepository,
    ) {}

    /**
     * @param  array{search?: string, experience_level?: string}  $filters
     */
    public function paginate(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        return $this->playerRepository->paginate($filters, $perPage);
    }

    public function find(int $id, array $relations = []): ?Player
    {
        return $this->playerRepository->findWithRelations($id, $relations);
    }

    public function create(array $data, ?UploadedFile $avatar = null): Player
    {
        if ($avatar !== null) {
            $data['user_id'] = $data['user_id'] ?? null;
            $player = $this->playerRepository->create($data);

            if ($player->user_id) {
                $this->uploadAvatar($player->user, $avatar);
            }

            return $player->fresh(['user']);
        }

        return $this->playerRepository->create($data);
    }

    public function update(Player $player, array $data, ?UploadedFile $avatar = null): Player
    {
        if ($avatar !== null && $player->user) {
            $this->uploadAvatar($player->user, $avatar);
        }

        return $this->playerRepository->update($player, $data);
    }

    public function delete(Player $player): bool
    {
        if ($player->user?->avatar) {
            Storage::disk('avatars')->delete($player->user->avatar);
        }

        return $this->playerRepository->delete($player);
    }

    public function uploadAvatar(User $user, UploadedFile $avatar): string
    {
        if ($user->avatar) {
            Storage::disk('avatars')->delete($user->avatar);
        }

        $path = $avatar->store(
            'users/'.$user->id,
            ['disk' => 'avatars'],
        );

        $user->update(['avatar' => $path]);

        return $path;
    }
}
