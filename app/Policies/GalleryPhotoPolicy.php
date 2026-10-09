<?php

namespace App\Policies;

use App\Models\GalleryPhoto;
use App\Models\User;
use App\Policies\Concerns\HandlesRoles;

class GalleryPhotoPolicy
{
    use HandlesRoles;

    public function viewAny(User $user): bool
    {
        return $this->isClubAdmin($user);
    }

    public function create(User $user): bool
    {
        return $this->isClubAdmin($user);
    }

    public function update(User $user, GalleryPhoto $galleryPhoto): bool
    {
        return $this->isClubAdmin($user);
    }

    public function delete(User $user, GalleryPhoto $galleryPhoto): bool
    {
        return $this->isClubAdmin($user);
    }
}
