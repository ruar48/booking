import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../wayfinder'
import calendarFa95d0 from './calendar'
import customers from './customers'
/**
* @see \App\Http\Controllers\ResourceBookingController::storeBulk
 * @see app/Http/Controllers/ResourceBookingController.php:78
 * @route '/bookings/bulk'
 */
export const storeBulk = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeBulk.url(options),
    method: 'post',
})

storeBulk.definition = {
    methods: ["post"],
    url: '/bookings/bulk',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ResourceBookingController::storeBulk
 * @see app/Http/Controllers/ResourceBookingController.php:78
 * @route '/bookings/bulk'
 */
storeBulk.url = (options?: RouteQueryOptions) => {
    return storeBulk.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ResourceBookingController::storeBulk
 * @see app/Http/Controllers/ResourceBookingController.php:78
 * @route '/bookings/bulk'
 */
storeBulk.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeBulk.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ResourceBookingController::calendar
 * @see app/Http/Controllers/ResourceBookingController.php:191
 * @route '/bookings/calendar'
 */
export const calendar = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: calendar.url(options),
    method: 'get',
})

calendar.definition = {
    methods: ["get","head"],
    url: '/bookings/calendar',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ResourceBookingController::calendar
 * @see app/Http/Controllers/ResourceBookingController.php:191
 * @route '/bookings/calendar'
 */
calendar.url = (options?: RouteQueryOptions) => {
    return calendar.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ResourceBookingController::calendar
 * @see app/Http/Controllers/ResourceBookingController.php:191
 * @route '/bookings/calendar'
 */
calendar.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: calendar.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ResourceBookingController::calendar
 * @see app/Http/Controllers/ResourceBookingController.php:191
 * @route '/bookings/calendar'
 */
calendar.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: calendar.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ResourceBookingController::markPaid
 * @see app/Http/Controllers/ResourceBookingController.php:164
 * @route '/bookings/{booking}/mark-paid'
 */
export const markPaid = (args: { booking: number | { id: number } } | [booking: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: markPaid.url(args, options),
    method: 'patch',
})

markPaid.definition = {
    methods: ["patch"],
    url: '/bookings/{booking}/mark-paid',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\ResourceBookingController::markPaid
 * @see app/Http/Controllers/ResourceBookingController.php:164
 * @route '/bookings/{booking}/mark-paid'
 */
markPaid.url = (args: { booking: number | { id: number } } | [booking: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { booking: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { booking: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    booking: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        booking: typeof args.booking === 'object'
                ? args.booking.id
                : args.booking,
                }

    return markPaid.definition.url
            .replace('{booking}', parsedArgs.booking.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ResourceBookingController::markPaid
 * @see app/Http/Controllers/ResourceBookingController.php:164
 * @route '/bookings/{booking}/mark-paid'
 */
markPaid.patch = (args: { booking: number | { id: number } } | [booking: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: markPaid.url(args, options),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\ResourceBookingController::storeWalkIn
 * @see app/Http/Controllers/ResourceBookingController.php:98
 * @route '/bookings/walk-in'
 */
export const storeWalkIn = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeWalkIn.url(options),
    method: 'post',
})

storeWalkIn.definition = {
    methods: ["post"],
    url: '/bookings/walk-in',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ResourceBookingController::storeWalkIn
 * @see app/Http/Controllers/ResourceBookingController.php:98
 * @route '/bookings/walk-in'
 */
storeWalkIn.url = (options?: RouteQueryOptions) => {
    return storeWalkIn.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ResourceBookingController::storeWalkIn
 * @see app/Http/Controllers/ResourceBookingController.php:98
 * @route '/bookings/walk-in'
 */
storeWalkIn.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeWalkIn.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ResourceBookingController::index
 * @see app/Http/Controllers/ResourceBookingController.php:36
 * @route '/bookings'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/bookings',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ResourceBookingController::index
 * @see app/Http/Controllers/ResourceBookingController.php:36
 * @route '/bookings'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ResourceBookingController::index
 * @see app/Http/Controllers/ResourceBookingController.php:36
 * @route '/bookings'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ResourceBookingController::index
 * @see app/Http/Controllers/ResourceBookingController.php:36
 * @route '/bookings'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ResourceBookingController::create
 * @see app/Http/Controllers/ResourceBookingController.php:53
 * @route '/bookings/create'
 */
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/bookings/create',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ResourceBookingController::create
 * @see app/Http/Controllers/ResourceBookingController.php:53
 * @route '/bookings/create'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ResourceBookingController::create
 * @see app/Http/Controllers/ResourceBookingController.php:53
 * @route '/bookings/create'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ResourceBookingController::create
 * @see app/Http/Controllers/ResourceBookingController.php:53
 * @route '/bookings/create'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ResourceBookingController::store
 * @see app/Http/Controllers/ResourceBookingController.php:60
 * @route '/bookings'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/bookings',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ResourceBookingController::store
 * @see app/Http/Controllers/ResourceBookingController.php:60
 * @route '/bookings'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ResourceBookingController::store
 * @see app/Http/Controllers/ResourceBookingController.php:60
 * @route '/bookings'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ResourceBookingController::show
 * @see app/Http/Controllers/ResourceBookingController.php:152
 * @route '/bookings/{booking}'
 */
export const show = (args: { booking: number | { id: number } } | [booking: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/bookings/{booking}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ResourceBookingController::show
 * @see app/Http/Controllers/ResourceBookingController.php:152
 * @route '/bookings/{booking}'
 */
show.url = (args: { booking: number | { id: number } } | [booking: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { booking: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { booking: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    booking: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        booking: typeof args.booking === 'object'
                ? args.booking.id
                : args.booking,
                }

    return show.definition.url
            .replace('{booking}', parsedArgs.booking.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ResourceBookingController::show
 * @see app/Http/Controllers/ResourceBookingController.php:152
 * @route '/bookings/{booking}'
 */
show.get = (args: { booking: number | { id: number } } | [booking: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ResourceBookingController::show
 * @see app/Http/Controllers/ResourceBookingController.php:152
 * @route '/bookings/{booking}'
 */
show.head = (args: { booking: number | { id: number } } | [booking: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ResourceBookingController::cancel
 * @see app/Http/Controllers/ResourceBookingController.php:177
 * @route '/bookings/{booking}/cancel'
 */
export const cancel = (args: { booking: number | { id: number } } | [booking: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: cancel.url(args, options),
    method: 'patch',
})

cancel.definition = {
    methods: ["patch"],
    url: '/bookings/{booking}/cancel',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\ResourceBookingController::cancel
 * @see app/Http/Controllers/ResourceBookingController.php:177
 * @route '/bookings/{booking}/cancel'
 */
cancel.url = (args: { booking: number | { id: number } } | [booking: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { booking: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { booking: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    booking: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        booking: typeof args.booking === 'object'
                ? args.booking.id
                : args.booking,
                }

    return cancel.definition.url
            .replace('{booking}', parsedArgs.booking.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ResourceBookingController::cancel
 * @see app/Http/Controllers/ResourceBookingController.php:177
 * @route '/bookings/{booking}/cancel'
 */
cancel.patch = (args: { booking: number | { id: number } } | [booking: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: cancel.url(args, options),
    method: 'patch',
})
const bookings = {
    storeBulk: Object.assign(storeBulk, storeBulk),
calendar: Object.assign(calendar, calendarFa95d0),
markPaid: Object.assign(markPaid, markPaid),
customers: Object.assign(customers, customers),
storeWalkIn: Object.assign(storeWalkIn, storeWalkIn),
index: Object.assign(index, index),
create: Object.assign(create, create),
store: Object.assign(store, store),
show: Object.assign(show, show),
cancel: Object.assign(cancel, cancel),
}

export default bookings