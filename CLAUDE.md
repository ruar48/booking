# Architecture & Code Standard

The rule every change is held to:

> **Controllers coordinate the request/response. They do not contain business logic.**
>
> Every class has one clear responsibility, and changing one business rule must
> not force edits in five unrelated places.

And the counter-rule that outranks it when they conflict:

> **Do not create architecture for the sake of architecture.** The goal is not
> 50 folders. A layer earns its place by solving a real problem in *this*
> codebase. Adding a wrapper that only forwards a call makes the code worse.

## Request flow

```
HTTP Request → Route → Controller → Form Request → Service / Action
             → Repository (only if it earns it) → Model → Database
```

External systems:

```
Controller → Service → Integration Client → PayMongo / third-party API
```

## Layers, and when each earns its place

| Layer | Use it when | Skip it when |
|---|---|---|
| **Form Request** | Any request with validation rules | Route-model-bound reads with no input |
| **Service** | Business rules, orchestration, transactions | The action is a single Eloquent call |
| **Action** | One specific operation that has its own rules | It's a thin pass-through to a service |
| **Repository** | Multiple data sources, caching, or genuinely complex reusable queries | Plain Eloquent reads — `Booking::query()->where(...)` is already a fine data layer |
| **DTO** | A payload crosses several layers and needs a guaranteed shape | An array that goes straight from request to `create()` |
| **Enum** | Any fixed set of statuses/roles | — always prefer an enum over a bare string |
| **Policy** | Any authorization decision | — never inline `if ($user->role !== 'admin')` |
| **Job** | Work the user should not wait for | Fast, synchronous work |
| **Event** | Several unrelated side effects react to one thing happening | One caller, one effect — call it directly |

## Controller rules

A controller method should read as: authorize → delegate → respond.

```php
public function store(StoreResourceBookingRequest $request): RedirectResponse
{
    $booking = $this->bookingService->create($request->validated(), $request->user());

    return to_route('bookings.checkout', $booking);
}
```

Specifically, a controller must **not**:

- build model attribute arrays (that's a Service, Action, or DTO)
- compute derived values — totals, deadlines, availability windows
- query models it doesn't directly act on to assemble a view payload
- contain `DB::transaction`, conditionals on domain state, or date arithmetic
- inline authorization checks — use a Policy

If a controller needs a payload assembled from several sources, that assembly
belongs in a Service; the controller passes the result to `Inertia::render`.

## Folder grouping

**Nest a domain folder once a layer holds 3+ files for that domain. Below
that, stay flat.** The threshold is the whole rule — it prevents both a
40-file flat dump and a tree of folders holding one class each.

Currently grouped: `Controllers/{OpenPlay,Rental,Pos,Admin,Settings}`,
`Requests/{Booking,Rental}`, `Services/Booking`, `Actions/{Booking,Fortify}`.
Everything under the threshold (Announcement, Player, Product, Tournament…)
stays flat until a third file arrives, and then moves as a unit.

**Never nest these**, even though it looks inconsistent:

- **Models** — Laravel auto-discovers policies (`App\Models\Foo` →
  `App\Policies\FooPolicy`) and factories by convention. Nesting breaks
  discovery and forces manual registration for no benefit.
- **Enums** and **Policies** — reached by name via IDE jump, never browsed by
  domain. Folders only add depth.

When moving a controller into a sub-namespace, add
`use App\Http\Controllers\Controller;` — the unqualified `extends Controller`
silently stops resolving, and it fails at route registration, not at lint.
After any move: `php artisan wayfinder:generate --with-form` (generated TS
action paths mirror controller namespaces), then `route:list` and the suite.

## Project-specific notes

- **This is an Inertia app, not a JSON API.** Pages receive props, so
  `app/Http/Resources/` is mostly not applicable — do not add API Resources
  just to tick a box. Use them only for the genuine JSON endpoints.
- **Services already exist flat** in `app/Services/`. New domain-heavy services
  may nest (`app/Services/Booking/`); do not mass-move existing ones purely for
  symmetry — the namespace churn buys nothing.
- **Repositories exist** under `app/Repositories/` with contracts in
  `app/Contracts/Repositories/`. Bind new ones in a provider. Do not add a
  repository that only wraps one Eloquent query.
- **Enums** live in `app/Enums/` and are cast on the model. Never compare
  against raw status strings.
- **Third-party clients** belong in `app/Integrations/{Vendor}/`, separate from
  the Service that uses them.

## Non-negotiables

1. Never compare or assign a raw status string — use the Enum case.
2. Never authorize inline — use a Policy and `$this->authorize(...)`.
3. Wrap multi-write operations in `DB::transaction`.
4. Scope every user-facing query by the authenticated user, resolved
   server-side. Never trust an id from the request for ownership.
5. Fail loudly in logs, quietly in the UI: log the real exception, return a
   safe message.
6. Degrade gracefully — a third-party outage must not take a page down.

## Verifying a change

Run before claiming a task is done:

```bash
php -l <changed files>      # or: ./vendor/bin/pint --test
npx tsc --noEmit -p .       # frontend type check
php artisan test
```

`npx tsc` currently reports pre-existing errors in
`resources/js/pages/settings/profile.tsx` — unrelated to new work; filter them
out rather than "fixing" them incidentally.
