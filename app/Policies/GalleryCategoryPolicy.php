<?php

namespace App\Policies;

use App\Models\GalleryCategory;
use App\Models\User;
use App\Policies\Concerns\HandlesRoles;

class GalleryCategoryPolicy
{
    use HandlesRoles;

    public function create(User $user): bool
    {
        return $this->isClubAdmin($user);
    }

    public function update(User $user, GalleryCategory $galleryCategory): bool
    {
        return $this->isClubAdmin($user);
    }

    public function delete(User $user, GalleryCategory $galleryCategory): bool
    {
        return $this->isClubAdmin($user);
    }
}
