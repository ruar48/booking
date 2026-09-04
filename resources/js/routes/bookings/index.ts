import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../wayfinder'
import calendarFa95d0 from './calendar'
import customers from './customers'
import checkoutFb28ab from './checkout'
/**
* @see \App\Http\Controllers\ResourceBookingController::storeBulk
 * @see app/Http/Controllers/ResourceBookingController.php:104
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
 * @see app/Http/Controllers/ResourceBookingController.php:104
 * @route '/bookings/bulk'
 */
storeBulk.url = (options?: RouteQueryOptions) => {
    return storeBulk.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ResourceBookingController::storeBulk
 * @see app/Http/Controllers/ResourceBookingController.php:104
 * @route '/bookings/bulk'
 */
storeBulk.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeBulk.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\ResourceBookingController::storeBulk
 * @see app/Http/Controllers/ResourceBookingController.php:104
 * @route '/bookings/bulk'
 */
    const storeBulkForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: storeBulk.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ResourceBookingController::storeBulk
 * @see app/Http/Controllers/ResourceBookingController.php:104
 * @route '/bookings/bulk'
 */
        storeBulkForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: storeBulk.url(options),
            method: 'post',
        })
    
    storeBulk.form = storeBulkForm
/**
* @see \App\Http\Controllers\ResourceBookingController::calendar
 * @see app/Http/Controllers/ResourceBookingController.php:253
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
 * @see app/Http/Controllers/ResourceBookingController.php:253
 * @route '/bookings/calendar'
 */
calendar.url = (options?: RouteQueryOptions) => {
    return calendar.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ResourceBookingController::calendar
 * @see app/Http/Controllers/ResourceBookingController.php:253
 * @route '/bookings/calendar'
 */
calendar.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: calendar.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ResourceBookingController::calendar
 * @see app/Http/Controllers/ResourceBookingController.php:253
 * @route '/bookings/calendar'
 */
calendar.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: calendar.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ResourceBookingController::calendar
 * @see app/Http/Controllers/ResourceBookingController.php:253
 * @route '/bookings/calendar'
 */
    const calendarForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: calendar.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ResourceBookingController::calendar
 * @see app/Http/Controllers/ResourceBookingController.php:253
 * @route '/bookings/calendar'
 */
        calendarForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: calendar.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ResourceBookingController::calendar
 * @see app/Http/Controllers/ResourceBookingController.php:253
 * @route '/bookings/calendar'
 */
        calendarForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: calendar.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    calendar.form = calendarForm
/**
* @see \App\Http\Controllers\ResourceBookingController::markPaid
 * @see app/Http/Controllers/ResourceBookingController.php:203
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
 * @see app/Http/Controllers/ResourceBookingController.php:203
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
 * @see app/Http/Controllers/ResourceBookingController.php:203
 * @route '/bookings/{booking}/mark-paid'
 */
markPaid.patch = (args: { booking: number | { id: number } } | [booking: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: markPaid.url(args, options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\ResourceBookingController::markPaid
 * @see app/Http/Controllers/ResourceBookingController.php:203
 * @route '/bookings/{booking}/mark-paid'
 */
    const markPaidForm = (args: { booking: number | { id: number } } | [booking: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: markPaid.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PATCH',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ResourceBookingController::markPaid
 * @see app/Http/Controllers/ResourceBookingController.php:203
 * @route '/bookings/{booking}/mark-paid'
 */
        markPaidForm.patch = (args: { booking: number | { id: number } } | [booking: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: markPaid.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PATCH',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    markPaid.form = markPaidForm
/**
* @see \App\Http\Controllers\ResourceBookingController::storeWalkIn
 * @see app/Http/Controllers/ResourceBookingController.php:122
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
 * @see app/Http/Controllers/ResourceBookingController.php:122
 * @route '/bookings/walk-in'
 */
storeWalkIn.url = (options?: RouteQueryOptions) => {
    return storeWalkIn.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ResourceBookingController::storeWalkIn
 * @see app/Http/Controllers/ResourceBookingController.php:122
 * @route '/bookings/walk-in'
 */
storeWalkIn.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeWalkIn.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\ResourceBookingController::storeWalkIn
 * @see app/Http/Controllers/ResourceBookingController.php:122
 * @route '/bookings/walk-in'
 */
    const storeWalkInForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: storeWalkIn.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ResourceBookingController::storeWalkIn
 * @see app/Http/Controllers/ResourceBookingController.php:122
 * @route '/bookings/walk-in'
 */
        storeWalkInForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: storeWalkIn.url(options),
            method: 'post',
        })
    
    storeWalkIn.form = storeWalkInForm
/**
* @see \App\Http\Controllers\ResourceBookingController::index
 * @see app/Http/Controllers/ResourceBookingController.php:47
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
 * @see app/Http/Controllers/ResourceBookingController.php:47
 * @route '/bookings'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ResourceBookingController::index
 * @see app/Http/Controllers/ResourceBookingController.php:47
 * @route '/bookings'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ResourceBookingController::index
 * @see app/Http/Controllers/ResourceBookingController.php:47
 * @route '/bookings'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ResourceBookingController::index
 * @see app/Http/Controllers/ResourceBookingController.php:47
 * @route '/bookings'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ResourceBookingController::index
 * @see app/Http/Controllers/ResourceBookingController.php:47
 * @route '/bookings'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ResourceBookingController::index
 * @see app/Http/Controllers/ResourceBookingController.php:47
 * @route '/bookings'
 */
        indexForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    index.form = indexForm
/**
* @see \App\Http\Controllers\ResourceBookingController::create
 * @see app/Http/Controllers/ResourceBookingController.php:74
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
 * @see app/Http/Controllers/ResourceBookingController.php:74
 * @route '/bookings/create'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ResourceBookingController::create
 * @see app/Http/Controllers/ResourceBookingController.php:74
 * @route '/bookings/create'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ResourceBookingController::create
 * @see app/Http/Controllers/ResourceBookingController.php:74
 * @route '/bookings/create'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ResourceBookingController::create
 * @see app/Http/Controllers/ResourceBookingController.php:74
 * @route '/bookings/create'
 */
    const createForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: create.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ResourceBookingController::create
 * @see app/Http/Controllers/ResourceBookingController.php:74
 * @route '/bookings/create'
 */
        createForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ResourceBookingController::create
 * @see app/Http/Controllers/ResourceBookingController.php:74
 * @route '/bookings/create'
 */
        createForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    create.form = createForm
/**
* @see \App\Http\Controllers\ResourceBookingController::store
 * @see app/Http/Controllers/ResourceBookingController.php:81
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
 * @see app/Http/Controllers/ResourceBookingController.php:81
 * @route '/bookings'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ResourceBookingController::store
 * @see app/Http/Controllers/ResourceBookingController.php:81
 * @route '/bookings'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\ResourceBookingController::store
 * @see app/Http/Controllers/ResourceBookingController.php:81
 * @route '/bookings'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ResourceBookingController::store
 * @see app/Http/Controllers/ResourceBookingController.php:81
 * @route '/bookings'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\ResourceBookingController::show
 * @see app/Http/Controllers/ResourceBookingController.php:156
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
 * @see app/Http/Controllers/ResourceBookingController.php:156
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
 * @see app/Http/Controllers/ResourceBookingController.php:156
 * @route '/bookings/{booking}'
 */
show.get = (args: { booking: number | { id: number } } | [booking: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ResourceBookingController::show
 * @see app/Http/Controllers/ResourceBookingController.php:156
 * @route '/bookings/{booking}'
 */
show.head = (args: { booking: number | { id: number } } | [booking: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ResourceBookingController::show
 * @see app/Http/Controllers/ResourceBookingController.php:156
 * @route '/bookings/{booking}'
 */
    const showForm = (args: { booking: number | { id: number } } | [booking: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ResourceBookingController::show
 * @see app/Http/Controllers/ResourceBookingController.php:156
 * @route '/bookings/{booking}'
 */
        showForm.get = (args: { booking: number | { id: number } } | [booking: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ResourceBookingController::show
 * @see app/Http/Controllers/ResourceBookingController.php:156
 * @route '/bookings/{booking}'
 */
        showForm.head = (args: { booking: number | { id: number } } | [booking: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    show.form = showForm
/**
* @see \App\Http\Controllers\ResourceBookingController::cancel
 * @see app/Http/Controllers/ResourceBookingController.php:214
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
 * @see app/Http/Controllers/ResourceBookingController.php:214
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
 * @see app/Http/Controllers/ResourceBookingController.php:214
 * @route '/bookings/{booking}/cancel'
 */
cancel.patch = (args: { booking: number | { id: number } } | [booking: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: cancel.url(args, options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\ResourceBookingController::cancel
 * @see app/Http/Controllers/ResourceBookingController.php:214
 * @route '/bookings/{booking}/cancel'
 */
    const cancelForm = (args: { booking: number | { id: number } } | [booking: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: cancel.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PATCH',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ResourceBookingController::cancel
 * @see app/Http/Controllers/ResourceBookingController.php:214
 * @route '/bookings/{booking}/cancel'
 */
        cancelForm.patch = (args: { booking: number | { id: number } } | [booking: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: cancel.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PATCH',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    cancel.form = cancelForm
/**
* @see \App\Http\Controllers\ResourceBookingController::reschedule
 * @see app/Http/Controllers/ResourceBookingController.php:235
 * @route '/bookings/{booking}/reschedule'
 */
export const reschedule = (args: { booking: number | { id: number } } | [booking: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: reschedule.url(args, options),
    method: 'patch',
})

reschedule.definition = {
    methods: ["patch"],
    url: '/bookings/{booking}/reschedule',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\ResourceBookingController::reschedule
 * @see app/Http/Controllers/ResourceBookingController.php:235
 * @route '/bookings/{booking}/reschedule'
 */
reschedule.url = (args: { booking: number | { id: number } } | [booking: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return reschedule.definition.url
            .replace('{booking}', parsedArgs.booking.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ResourceBookingController::reschedule
 * @see app/Http/Controllers/ResourceBookingController.php:235
 * @route '/bookings/{booking}/reschedule'
 */
reschedule.patch = (args: { booking: number | { id: number } } | [booking: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: reschedule.url(args, options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\ResourceBookingController::reschedule
 * @see app/Http/Controllers/ResourceBookingController.php:235
 * @route '/bookings/{booking}/reschedule'
 */
    const rescheduleForm = (args: { booking: number | { id: number } } | [booking: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: reschedule.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PATCH',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ResourceBookingController::reschedule
 * @see app/Http/Controllers/ResourceBookingController.php:235
 * @route '/bookings/{booking}/reschedule'
 */
        rescheduleForm.patch = (args: { booking: number | { id: number } } | [booking: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: reschedule.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PATCH',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    reschedule.form = rescheduleForm
/**
* @see \App\Http\Controllers\ResourceBookingController::checkout
 * @see app/Http/Controllers/ResourceBookingController.php:163
 * @route '/bookings/{booking}/checkout'
 */
export const checkout = (args: { booking: number | { id: number } } | [booking: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: checkout.url(args, options),
    method: 'get',
})

checkout.definition = {
    methods: ["get","head"],
    url: '/bookings/{booking}/checkout',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ResourceBookingController::checkout
 * @see app/Http/Controllers/ResourceBookingController.php:163
 * @route '/bookings/{booking}/checkout'
 */
checkout.url = (args: { booking: number | { id: number } } | [booking: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return checkout.definition.url
            .replace('{booking}', parsedArgs.booking.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ResourceBookingController::checkout
 * @see app/Http/Controllers/ResourceBookingController.php:163
 * @route '/bookings/{booking}/checkout'
 */
checkout.get = (args: { booking: number | { id: number } } | [booking: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: checkout.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ResourceBookingController::checkout
 * @see app/Http/Controllers/ResourceBookingController.php:163
 * @route '/bookings/{booking}/checkout'
 */
checkout.head = (args: { booking: number | { id: number } } | [booking: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: checkout.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ResourceBookingController::checkout
 * @see app/Http/Controllers/ResourceBookingController.php:163
 * @route '/bookings/{booking}/checkout'
 */
    const checkoutForm = (args: { booking: number | { id: number } } | [booking: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: checkout.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ResourceBookingController::checkout
 * @see app/Http/Controllers/ResourceBookingController.php:163
 * @route '/bookings/{booking}/checkout'
 */
        checkoutForm.get = (args: { booking: number | { id: number } } | [booking: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: checkout.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ResourceBookingController::checkout
 * @see app/Http/Controllers/ResourceBookingController.php:163
 * @route '/bookings/{booking}/checkout'
 */
        checkoutForm.head = (args: { booking: number | { id: number } } | [booking: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: checkout.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    checkout.form = checkoutForm
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
reschedule: Object.assign(reschedule, reschedule),
checkout: Object.assign(checkout, checkoutFb28ab),
}

export default bookings