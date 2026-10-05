<?php

use App\Enums\RentalItemStatus;
use App\Enums\RentalStatus;
use App\Enums\Role;
use App\Models\RentalItem;
use App\Models\RentalTransaction;
use App\Models\User;
use Database\Seeders\RentalItemSeeder;

function rentalClubAdmin(): User
{
    $user = User::factory()->create();
    $user->assignRole(Role::ClubAdmin->value);

    return $user;
}

function makeRentalItem(array $overrides = []): RentalItem
{
    return RentalItem::query()->create([
        'name' => 'Paddle',
        'sku' => 'PAD-001',
        'category' => 'paddles',
        'rate' => 150,
        'hourly_rate' => null,
        'total_quantity' => 12,
        'available_quantity' => 12,
        'status' => RentalItemStatus::Active,
        'description' => null,
        ...$overrides,
    ]);
}

/**
 * The payload the edit form actually sends: every field, with the values it
 * was hydrated with (rate arrives as the "150.00" string the decimal cast
 * serialises, hourly_rate as '' when blank).
 */
function rentalEditPayload(RentalItem $item, array $overrides = []): array
{
    return [
        'name' => $item->name,
        'sku' => $item->sku,
        'category' => $item->category ?? '',
        'rate' => $item->rate,
        'hourly_rate' => $item->hourly_rate ?? '',
        'total_quantity' => $item->total_quantity,
        'status' => $item->status->value,
        'description' => $item->description ?? '',
        ...$overrides,
    ];
}

test('editing a rental item saves the changes', function () {
    $admin = rentalClubAdmin();
    $item = makeRentalItem();

    $this->actingAs($admin)
        ->put(route('rental-items.update', $item), rentalEditPayload($item, [
            'name' => 'Pro Paddle',
            'rate' => 175,
            'status' => RentalItemStatus::Inactive->value,
        ]))
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('rental-items.index'));

    $item->refresh();

    expect($item->name)->toBe('Pro Paddle')
        ->and((float) $item->rate)->toBe(175.0)
        ->and($item->status)->toBe(RentalItemStatus::Inactive);
});

test('saving an untouched rental item keeps its own sku', function () {
    $admin = rentalClubAdmin();
    $item = makeRentalItem();

    $this->actingAs($admin)
        ->put(route('rental-items.update', $item), rentalEditPayload($item))
        ->assertSessionHasNoErrors();
});

test('changing total quantity shifts availability by the same delta', function () {
    $admin = rentalClubAdmin();
    $item = makeRentalItem(['total_quantity' => 12, 'available_quantity' => 10]);

    $this->actingAs($admin)
        ->put(route('rental-items.update', $item), rentalEditPayload($item, ['total_quantity' => 15]))
        ->assertSessionHasNoErrors();

    expect($item->refresh()->available_quantity)->toBe(13)
        ->and($item->total_quantity)->toBe(15);
});

test('renting out lowers availability and returning restores it', function () {
    $admin = rentalClubAdmin();
    $item = makeRentalItem();

    $this->actingAs($admin)
        ->post(route('rentals.store'), [
            'items' => [['rental_item_id' => $item->id, 'quantity' => 2]],
            'renter_name' => 'Walk-in',
        ])
        ->assertSessionHasNoErrors();

    expect($item->refresh()->available_quantity)->toBe(10);

    $transaction = RentalTransaction::query()->with('items')->sole();

    $this->actingAs($admin)
        ->patch(route('rentals.transactions.return-items', $transaction), [
            'items' => [[
                'rental_transaction_item_id' => $transaction->items->first()->id,
                'quantity_returned' => 2,
            ]],
        ])
        ->assertSessionHasNoErrors();

    expect($item->refresh()->available_quantity)->toBe(12)
        ->and($transaction->refresh()->status)->toBe(RentalStatus::Returned);
});

// Regression: returning units of an item deleted while they were out threw a
// TypeError (the relation skipped the soft-deleted item) and a 500 page.
test('units of a deleted item can still be returned', function () {
    $admin = rentalClubAdmin();
    $item = makeRentalItem();

    $this->actingAs($admin)->post(route('rentals.store'), [
        'items' => [['rental_item_id' => $item->id, 'quantity' => 2]],
        'renter_name' => 'Walk-in',
    ]);

    $transaction = RentalTransaction::query()->with('items')->sole();
    $item->delete();

    $this->actingAs($admin)
        ->patch(route('rentals.transactions.return-items', $transaction), [
            'items' => [[
                'rental_transaction_item_id' => $transaction->items->first()->id,
                'quantity_returned' => 2,
            ]],
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect();

    expect($transaction->refresh()->status)->toBe(RentalStatus::Returned)
        ->and(RentalItem::withTrashed()->find($item->id)->available_quantity)->toBe(12);
});

test('the rentals index reflects current availability and revenue', function () {
    $admin = rentalClubAdmin();
    $item = makeRentalItem();

    $this->actingAs($admin)->post(route('rentals.store'), [
        'items' => [['rental_item_id' => $item->id, 'quantity' => 2]],
    ]);

    $this->actingAs($admin)
        ->get(route('rental-items.index'))
        ->assertInertia(fn ($page) => $page
            ->component('rentals/index')
            ->where('rentalItems.data.0.available_quantity', 10)
            ->where('rentalItems.data.0.revenue', 300));
});

test('a member rental lowers availability', function () {
    $member = User::factory()->create();
    $member->assignRole(Role::Player->value);
    $item = makeRentalItem();

    $this->actingAs($member)
        ->post(route('rentals.rent'), [
            'rental_item_id' => $item->id,
            'quantity' => 3,
            'duration_type' => 'daily',
        ])
        ->assertSessionHasNoErrors();

    expect($item->refresh()->available_quantity)->toBe(9);
});

test('re-running the rental seeder keeps admin edits and rented-out availability', function () {
    $this->seed(RentalItemSeeder::class);

    $item = RentalItem::query()->where('sku', 'RNT-PADL-STD')->sole();
    $item->update(['name' => 'Renamed Paddle', 'rate' => 125, 'available_quantity' => 7]);

    $this->seed(RentalItemSeeder::class);

    $item->refresh();

    expect($item->name)->toBe('Renamed Paddle')
        ->and((float) $item->rate)->toBe(125.0)
        ->and($item->available_quantity)->toBe(7);
});
