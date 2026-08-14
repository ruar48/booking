import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\ResourceBookingController::storeBulk
<<<<<<< HEAD
 * @see app/Http/Controllers/ResourceBookingController.php:96
=======
<<<<<<< Updated upstream
 * @see app/Http/Controllers/ResourceBookingController.php:96
=======
 * @see app/Http/Controllers/ResourceBookingController.php:78
>>>>>>> Stashed changes
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
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
<<<<<<< HEAD
 * @see app/Http/Controllers/ResourceBookingController.php:96
=======
<<<<<<< Updated upstream
 * @see app/Http/Controllers/ResourceBookingController.php:96
=======
 * @see app/Http/Controllers/ResourceBookingController.php:78
>>>>>>> Stashed changes
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
 * @route '/bookings/bulk'
 */
storeBulk.url = (options?: RouteQueryOptions) => {
    return storeBulk.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ResourceBookingController::storeBulk
<<<<<<< HEAD
 * @see app/Http/Controllers/ResourceBookingController.php:96
=======
<<<<<<< Updated upstream
 * @see app/Http/Controllers/ResourceBookingController.php:96
=======
 * @see app/Http/Controllers/ResourceBookingController.php:78
>>>>>>> Stashed changes
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
 * @route '/bookings/bulk'
 */
storeBulk.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeBulk.url(options),
    method: 'post',
})

<<<<<<< Updated upstream
/**
* @see \App\Http\Controllers\ResourceBookingController::calendar
 * @see app/Http/Controllers/ResourceBookingController.php:365
=======
    /**
* @see \App\Http\Controllers\ResourceBookingController::storeBulk
<<<<<<< HEAD
 * @see app/Http/Controllers/ResourceBookingController.php:96
=======
 * @see app/Http/Controllers/ResourceBookingController.php:78
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
 * @route '/bookings/bulk'
 */
    const storeBulkForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: storeBulk.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ResourceBookingController::storeBulk
<<<<<<< HEAD
 * @see app/Http/Controllers/ResourceBookingController.php:96
=======
 * @see app/Http/Controllers/ResourceBookingController.php:78
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
 * @route '/bookings/bulk'
 */
        storeBulkForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: storeBulk.url(options),
            method: 'post',
        })
    
    storeBulk.form = storeBulkForm
/**
* @see \App\Http\Controllers\ResourceBookingController::calendar
<<<<<<< HEAD
 * @see app/Http/Controllers/ResourceBookingController.php:365
=======
 * @see app/Http/Controllers/ResourceBookingController.php:191
>>>>>>> Stashed changes
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
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
<<<<<<< HEAD
 * @see app/Http/Controllers/ResourceBookingController.php:365
=======
<<<<<<< Updated upstream
 * @see app/Http/Controllers/ResourceBookingController.php:365
=======
 * @see app/Http/Controllers/ResourceBookingController.php:191
>>>>>>> Stashed changes
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
 * @route '/bookings/calendar'
 */
calendar.url = (options?: RouteQueryOptions) => {
    return calendar.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ResourceBookingController::calendar
<<<<<<< HEAD
 * @see app/Http/Controllers/ResourceBookingController.php:365
=======
<<<<<<< Updated upstream
 * @see app/Http/Controllers/ResourceBookingController.php:365
=======
 * @see app/Http/Controllers/ResourceBookingController.php:191
>>>>>>> Stashed changes
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
 * @route '/bookings/calendar'
 */
calendar.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: calendar.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ResourceBookingController::calendar
<<<<<<< HEAD
 * @see app/Http/Controllers/ResourceBookingController.php:365
=======
<<<<<<< Updated upstream
 * @see app/Http/Controllers/ResourceBookingController.php:365
=======
 * @see app/Http/Controllers/ResourceBookingController.php:191
>>>>>>> Stashed changes
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
 * @route '/bookings/calendar'
 */
calendar.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: calendar.url(options),
    method: 'head',
})

<<<<<<< Updated upstream
/**
* @see \App\Http\Controllers\ResourceBookingController::closeDate
 * @see app/Http/Controllers/ResourceBookingController.php:391
=======
    /**
* @see \App\Http\Controllers\ResourceBookingController::calendar
<<<<<<< HEAD
 * @see app/Http/Controllers/ResourceBookingController.php:365
=======
 * @see app/Http/Controllers/ResourceBookingController.php:191
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
 * @route '/bookings/calendar'
 */
    const calendarForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: calendar.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ResourceBookingController::calendar
<<<<<<< HEAD
 * @see app/Http/Controllers/ResourceBookingController.php:365
=======
 * @see app/Http/Controllers/ResourceBookingController.php:191
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
 * @route '/bookings/calendar'
 */
        calendarForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: calendar.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ResourceBookingController::calendar
<<<<<<< HEAD
 * @see app/Http/Controllers/ResourceBookingController.php:365
=======
 * @see app/Http/Controllers/ResourceBookingController.php:191
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
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
* @see \App\Http\Controllers\ResourceBookingController::closeDate
<<<<<<< HEAD
 * @see app/Http/Controllers/ResourceBookingController.php:391
=======
 * @see app/Http/Controllers/ResourceBookingController.php:212
>>>>>>> Stashed changes
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
 * @route '/bookings/calendar/close-date'
 */
export const closeDate = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: closeDate.url(options),
    method: 'post',
})

closeDate.definition = {
    methods: ["post"],
    url: '/bookings/calendar/close-date',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ResourceBookingController::closeDate
<<<<<<< HEAD
 * @see app/Http/Controllers/ResourceBookingController.php:391
=======
<<<<<<< Updated upstream
 * @see app/Http/Controllers/ResourceBookingController.php:391
=======
 * @see app/Http/Controllers/ResourceBookingController.php:212
>>>>>>> Stashed changes
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
 * @route '/bookings/calendar/close-date'
 */
closeDate.url = (options?: RouteQueryOptions) => {
    return closeDate.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ResourceBookingController::closeDate
<<<<<<< HEAD
 * @see app/Http/Controllers/ResourceBookingController.php:391
=======
<<<<<<< Updated upstream
 * @see app/Http/Controllers/ResourceBookingController.php:391
=======
 * @see app/Http/Controllers/ResourceBookingController.php:212
>>>>>>> Stashed changes
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
 * @route '/bookings/calendar/close-date'
 */
closeDate.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: closeDate.url(options),
    method: 'post',
})

<<<<<<< Updated upstream
/**
* @see \App\Http\Controllers\ResourceBookingController::reopenDate
 * @see app/Http/Controllers/ResourceBookingController.php:418
=======
    /**
* @see \App\Http\Controllers\ResourceBookingController::closeDate
<<<<<<< HEAD
 * @see app/Http/Controllers/ResourceBookingController.php:391
=======
 * @see app/Http/Controllers/ResourceBookingController.php:212
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
 * @route '/bookings/calendar/close-date'
 */
    const closeDateForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: closeDate.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ResourceBookingController::closeDate
<<<<<<< HEAD
 * @see app/Http/Controllers/ResourceBookingController.php:391
=======
 * @see app/Http/Controllers/ResourceBookingController.php:212
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
 * @route '/bookings/calendar/close-date'
 */
        closeDateForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: closeDate.url(options),
            method: 'post',
        })
    
    closeDate.form = closeDateForm
/**
* @see \App\Http\Controllers\ResourceBookingController::reopenDate
<<<<<<< HEAD
 * @see app/Http/Controllers/ResourceBookingController.php:418
=======
 * @see app/Http/Controllers/ResourceBookingController.php:237
>>>>>>> Stashed changes
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
 * @route '/bookings/calendar/reopen-date'
 */
export const reopenDate = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: reopenDate.url(options),
    method: 'post',
})

reopenDate.definition = {
    methods: ["post"],
    url: '/bookings/calendar/reopen-date',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ResourceBookingController::reopenDate
<<<<<<< HEAD
 * @see app/Http/Controllers/ResourceBookingController.php:418
=======
<<<<<<< Updated upstream
 * @see app/Http/Controllers/ResourceBookingController.php:418
=======
 * @see app/Http/Controllers/ResourceBookingController.php:237
>>>>>>> Stashed changes
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
 * @route '/bookings/calendar/reopen-date'
 */
reopenDate.url = (options?: RouteQueryOptions) => {
    return reopenDate.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ResourceBookingController::reopenDate
<<<<<<< HEAD
 * @see app/Http/Controllers/ResourceBookingController.php:418
=======
<<<<<<< Updated upstream
 * @see app/Http/Controllers/ResourceBookingController.php:418
=======
 * @see app/Http/Controllers/ResourceBookingController.php:237
>>>>>>> Stashed changes
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
 * @route '/bookings/calendar/reopen-date'
 */
reopenDate.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: reopenDate.url(options),
    method: 'post',
})

<<<<<<< Updated upstream
/**
* @see \App\Http\Controllers\ResourceBookingController::markPaid
 * @see app/Http/Controllers/ResourceBookingController.php:333
=======
    /**
* @see \App\Http\Controllers\ResourceBookingController::reopenDate
<<<<<<< HEAD
 * @see app/Http/Controllers/ResourceBookingController.php:418
=======
 * @see app/Http/Controllers/ResourceBookingController.php:237
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
 * @route '/bookings/calendar/reopen-date'
 */
    const reopenDateForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: reopenDate.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ResourceBookingController::reopenDate
<<<<<<< HEAD
 * @see app/Http/Controllers/ResourceBookingController.php:418
=======
 * @see app/Http/Controllers/ResourceBookingController.php:237
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
 * @route '/bookings/calendar/reopen-date'
 */
        reopenDateForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: reopenDate.url(options),
            method: 'post',
        })
    
    reopenDate.form = reopenDateForm
/**
* @see \App\Http\Controllers\ResourceBookingController::markPaid
<<<<<<< HEAD
 * @see app/Http/Controllers/ResourceBookingController.php:333
=======
 * @see app/Http/Controllers/ResourceBookingController.php:164
>>>>>>> Stashed changes
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
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
<<<<<<< HEAD
 * @see app/Http/Controllers/ResourceBookingController.php:333
=======
<<<<<<< Updated upstream
 * @see app/Http/Controllers/ResourceBookingController.php:333
=======
 * @see app/Http/Controllers/ResourceBookingController.php:164
>>>>>>> Stashed changes
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
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
<<<<<<< HEAD
 * @see app/Http/Controllers/ResourceBookingController.php:333
=======
<<<<<<< Updated upstream
 * @see app/Http/Controllers/ResourceBookingController.php:333
=======
 * @see app/Http/Controllers/ResourceBookingController.php:164
>>>>>>> Stashed changes
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
 * @route '/bookings/{booking}/mark-paid'
 */
markPaid.patch = (args: { booking: number | { id: number } } | [booking: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: markPaid.url(args, options),
    method: 'patch',
})

<<<<<<< Updated upstream
/**
* @see \App\Http\Controllers\ResourceBookingController::searchCustomers
 * @see app/Http/Controllers/ResourceBookingController.php:174
=======
    /**
* @see \App\Http\Controllers\ResourceBookingController::markPaid
<<<<<<< HEAD
 * @see app/Http/Controllers/ResourceBookingController.php:333
=======
 * @see app/Http/Controllers/ResourceBookingController.php:164
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
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
<<<<<<< HEAD
 * @see app/Http/Controllers/ResourceBookingController.php:333
=======
 * @see app/Http/Controllers/ResourceBookingController.php:164
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
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
* @see \App\Http\Controllers\ResourceBookingController::searchCustomers
<<<<<<< HEAD
 * @see app/Http/Controllers/ResourceBookingController.php:174
=======
 * @see app/Http/Controllers/ResourceBookingController.php:135
>>>>>>> Stashed changes
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
 * @route '/bookings/customers/search'
 */
export const searchCustomers = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: searchCustomers.url(options),
    method: 'get',
})

searchCustomers.definition = {
    methods: ["get","head"],
    url: '/bookings/customers/search',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ResourceBookingController::searchCustomers
<<<<<<< HEAD
 * @see app/Http/Controllers/ResourceBookingController.php:174
=======
<<<<<<< Updated upstream
 * @see app/Http/Controllers/ResourceBookingController.php:174
=======
 * @see app/Http/Controllers/ResourceBookingController.php:135
>>>>>>> Stashed changes
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
 * @route '/bookings/customers/search'
 */
searchCustomers.url = (options?: RouteQueryOptions) => {
    return searchCustomers.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ResourceBookingController::searchCustomers
<<<<<<< HEAD
 * @see app/Http/Controllers/ResourceBookingController.php:174
=======
<<<<<<< Updated upstream
 * @see app/Http/Controllers/ResourceBookingController.php:174
=======
 * @see app/Http/Controllers/ResourceBookingController.php:135
>>>>>>> Stashed changes
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
 * @route '/bookings/customers/search'
 */
searchCustomers.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: searchCustomers.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ResourceBookingController::searchCustomers
<<<<<<< HEAD
 * @see app/Http/Controllers/ResourceBookingController.php:174
=======
<<<<<<< Updated upstream
 * @see app/Http/Controllers/ResourceBookingController.php:174
=======
 * @see app/Http/Controllers/ResourceBookingController.php:135
>>>>>>> Stashed changes
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
 * @route '/bookings/customers/search'
 */
searchCustomers.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: searchCustomers.url(options),
    method: 'head',
})

<<<<<<< Updated upstream
/**
* @see \App\Http\Controllers\ResourceBookingController::storeWalkIn
 * @see app/Http/Controllers/ResourceBookingController.php:134
=======
    /**
* @see \App\Http\Controllers\ResourceBookingController::searchCustomers
<<<<<<< HEAD
 * @see app/Http/Controllers/ResourceBookingController.php:174
=======
 * @see app/Http/Controllers/ResourceBookingController.php:135
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
 * @route '/bookings/customers/search'
 */
    const searchCustomersForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: searchCustomers.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ResourceBookingController::searchCustomers
<<<<<<< HEAD
 * @see app/Http/Controllers/ResourceBookingController.php:174
=======
 * @see app/Http/Controllers/ResourceBookingController.php:135
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
 * @route '/bookings/customers/search'
 */
        searchCustomersForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: searchCustomers.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ResourceBookingController::searchCustomers
<<<<<<< HEAD
 * @see app/Http/Controllers/ResourceBookingController.php:174
=======
 * @see app/Http/Controllers/ResourceBookingController.php:135
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
 * @route '/bookings/customers/search'
 */
        searchCustomersForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: searchCustomers.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    searchCustomers.form = searchCustomersForm
/**
* @see \App\Http\Controllers\ResourceBookingController::storeWalkIn
<<<<<<< HEAD
 * @see app/Http/Controllers/ResourceBookingController.php:134
=======
 * @see app/Http/Controllers/ResourceBookingController.php:98
>>>>>>> Stashed changes
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
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
<<<<<<< HEAD
 * @see app/Http/Controllers/ResourceBookingController.php:134
=======
<<<<<<< Updated upstream
 * @see app/Http/Controllers/ResourceBookingController.php:134
=======
 * @see app/Http/Controllers/ResourceBookingController.php:98
>>>>>>> Stashed changes
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
 * @route '/bookings/walk-in'
 */
storeWalkIn.url = (options?: RouteQueryOptions) => {
    return storeWalkIn.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ResourceBookingController::storeWalkIn
<<<<<<< HEAD
 * @see app/Http/Controllers/ResourceBookingController.php:134
=======
<<<<<<< Updated upstream
 * @see app/Http/Controllers/ResourceBookingController.php:134
=======
 * @see app/Http/Controllers/ResourceBookingController.php:98
>>>>>>> Stashed changes
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
 * @route '/bookings/walk-in'
 */
storeWalkIn.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeWalkIn.url(options),
    method: 'post',
})

<<<<<<< Updated upstream
=======
    /**
* @see \App\Http\Controllers\ResourceBookingController::storeWalkIn
<<<<<<< HEAD
 * @see app/Http/Controllers/ResourceBookingController.php:134
=======
 * @see app/Http/Controllers/ResourceBookingController.php:98
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
 * @route '/bookings/walk-in'
 */
    const storeWalkInForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: storeWalkIn.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ResourceBookingController::storeWalkIn
<<<<<<< HEAD
 * @see app/Http/Controllers/ResourceBookingController.php:134
=======
 * @see app/Http/Controllers/ResourceBookingController.php:98
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
 * @route '/bookings/walk-in'
 */
        storeWalkInForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: storeWalkIn.url(options),
            method: 'post',
        })
    
    storeWalkIn.form = storeWalkInForm
>>>>>>> Stashed changes
/**
* @see \App\Http\Controllers\ResourceBookingController::index
 * @see app/Http/Controllers/ResourceBookingController.php:43
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
 * @see app/Http/Controllers/ResourceBookingController.php:43
 * @route '/bookings'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ResourceBookingController::index
 * @see app/Http/Controllers/ResourceBookingController.php:43
 * @route '/bookings'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ResourceBookingController::index
 * @see app/Http/Controllers/ResourceBookingController.php:43
 * @route '/bookings'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

<<<<<<< HEAD
    /**
* @see \App\Http\Controllers\ResourceBookingController::index
 * @see app/Http/Controllers/ResourceBookingController.php:43
 * @route '/bookings'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ResourceBookingController::index
 * @see app/Http/Controllers/ResourceBookingController.php:43
 * @route '/bookings'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ResourceBookingController::index
 * @see app/Http/Controllers/ResourceBookingController.php:43
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
 * @see app/Http/Controllers/ResourceBookingController.php:63
=======
/**
* @see \App\Http\Controllers\ResourceBookingController::create
<<<<<<< Updated upstream
 * @see app/Http/Controllers/ResourceBookingController.php:63
=======
 * @see app/Http/Controllers/ResourceBookingController.php:53
>>>>>>> Stashed changes
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
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
<<<<<<< HEAD
 * @see app/Http/Controllers/ResourceBookingController.php:63
=======
<<<<<<< Updated upstream
 * @see app/Http/Controllers/ResourceBookingController.php:63
=======
 * @see app/Http/Controllers/ResourceBookingController.php:53
>>>>>>> Stashed changes
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
 * @route '/bookings/create'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ResourceBookingController::create
<<<<<<< HEAD
 * @see app/Http/Controllers/ResourceBookingController.php:63
=======
<<<<<<< Updated upstream
 * @see app/Http/Controllers/ResourceBookingController.php:63
=======
 * @see app/Http/Controllers/ResourceBookingController.php:53
>>>>>>> Stashed changes
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
 * @route '/bookings/create'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ResourceBookingController::create
<<<<<<< HEAD
 * @see app/Http/Controllers/ResourceBookingController.php:63
=======
<<<<<<< Updated upstream
 * @see app/Http/Controllers/ResourceBookingController.php:63
=======
 * @see app/Http/Controllers/ResourceBookingController.php:53
>>>>>>> Stashed changes
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
 * @route '/bookings/create'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

<<<<<<< Updated upstream
/**
* @see \App\Http\Controllers\ResourceBookingController::store
 * @see app/Http/Controllers/ResourceBookingController.php:70
=======
    /**
* @see \App\Http\Controllers\ResourceBookingController::create
<<<<<<< HEAD
 * @see app/Http/Controllers/ResourceBookingController.php:63
=======
 * @see app/Http/Controllers/ResourceBookingController.php:53
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
 * @route '/bookings/create'
 */
    const createForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: create.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ResourceBookingController::create
<<<<<<< HEAD
 * @see app/Http/Controllers/ResourceBookingController.php:63
=======
 * @see app/Http/Controllers/ResourceBookingController.php:53
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
 * @route '/bookings/create'
 */
        createForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ResourceBookingController::create
<<<<<<< HEAD
 * @see app/Http/Controllers/ResourceBookingController.php:63
=======
 * @see app/Http/Controllers/ResourceBookingController.php:53
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
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
<<<<<<< HEAD
 * @see app/Http/Controllers/ResourceBookingController.php:70
=======
 * @see app/Http/Controllers/ResourceBookingController.php:60
>>>>>>> Stashed changes
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
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
<<<<<<< HEAD
 * @see app/Http/Controllers/ResourceBookingController.php:70
=======
<<<<<<< Updated upstream
 * @see app/Http/Controllers/ResourceBookingController.php:70
=======
 * @see app/Http/Controllers/ResourceBookingController.php:60
>>>>>>> Stashed changes
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
 * @route '/bookings'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ResourceBookingController::store
<<<<<<< HEAD
 * @see app/Http/Controllers/ResourceBookingController.php:70
=======
<<<<<<< Updated upstream
 * @see app/Http/Controllers/ResourceBookingController.php:70
=======
 * @see app/Http/Controllers/ResourceBookingController.php:60
>>>>>>> Stashed changes
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
 * @route '/bookings'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

<<<<<<< Updated upstream
/**
* @see \App\Http\Controllers\ResourceBookingController::show
 * @see app/Http/Controllers/ResourceBookingController.php:191
=======
    /**
* @see \App\Http\Controllers\ResourceBookingController::store
<<<<<<< HEAD
 * @see app/Http/Controllers/ResourceBookingController.php:70
=======
 * @see app/Http/Controllers/ResourceBookingController.php:60
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
 * @route '/bookings'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ResourceBookingController::store
<<<<<<< HEAD
 * @see app/Http/Controllers/ResourceBookingController.php:70
=======
 * @see app/Http/Controllers/ResourceBookingController.php:60
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
 * @route '/bookings'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\ResourceBookingController::show
<<<<<<< HEAD
 * @see app/Http/Controllers/ResourceBookingController.php:191
=======
 * @see app/Http/Controllers/ResourceBookingController.php:152
>>>>>>> Stashed changes
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
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
<<<<<<< HEAD
 * @see app/Http/Controllers/ResourceBookingController.php:191
=======
<<<<<<< Updated upstream
 * @see app/Http/Controllers/ResourceBookingController.php:191
=======
 * @see app/Http/Controllers/ResourceBookingController.php:152
>>>>>>> Stashed changes
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
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
<<<<<<< HEAD
 * @see app/Http/Controllers/ResourceBookingController.php:191
=======
<<<<<<< Updated upstream
 * @see app/Http/Controllers/ResourceBookingController.php:191
=======
 * @see app/Http/Controllers/ResourceBookingController.php:152
>>>>>>> Stashed changes
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
 * @route '/bookings/{booking}'
 */
show.get = (args: { booking: number | { id: number } } | [booking: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ResourceBookingController::show
<<<<<<< HEAD
 * @see app/Http/Controllers/ResourceBookingController.php:191
=======
<<<<<<< Updated upstream
 * @see app/Http/Controllers/ResourceBookingController.php:191
=======
 * @see app/Http/Controllers/ResourceBookingController.php:152
>>>>>>> Stashed changes
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
 * @route '/bookings/{booking}'
 */
show.head = (args: { booking: number | { id: number } } | [booking: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

<<<<<<< Updated upstream
/**
* @see \App\Http\Controllers\ResourceBookingController::cancel
 * @see app/Http/Controllers/ResourceBookingController.php:347
=======
    /**
* @see \App\Http\Controllers\ResourceBookingController::show
<<<<<<< HEAD
 * @see app/Http/Controllers/ResourceBookingController.php:191
=======
 * @see app/Http/Controllers/ResourceBookingController.php:152
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
 * @route '/bookings/{booking}'
 */
    const showForm = (args: { booking: number | { id: number } } | [booking: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ResourceBookingController::show
<<<<<<< HEAD
 * @see app/Http/Controllers/ResourceBookingController.php:191
=======
 * @see app/Http/Controllers/ResourceBookingController.php:152
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
 * @route '/bookings/{booking}'
 */
        showForm.get = (args: { booking: number | { id: number } } | [booking: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ResourceBookingController::show
<<<<<<< HEAD
 * @see app/Http/Controllers/ResourceBookingController.php:191
=======
 * @see app/Http/Controllers/ResourceBookingController.php:152
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
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
<<<<<<< HEAD
 * @see app/Http/Controllers/ResourceBookingController.php:347
=======
 * @see app/Http/Controllers/ResourceBookingController.php:177
>>>>>>> Stashed changes
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
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
<<<<<<< HEAD
 * @see app/Http/Controllers/ResourceBookingController.php:347
=======
<<<<<<< Updated upstream
 * @see app/Http/Controllers/ResourceBookingController.php:347
=======
 * @see app/Http/Controllers/ResourceBookingController.php:177
>>>>>>> Stashed changes
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
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
<<<<<<< HEAD
 * @see app/Http/Controllers/ResourceBookingController.php:347
=======
<<<<<<< Updated upstream
 * @see app/Http/Controllers/ResourceBookingController.php:347
=======
 * @see app/Http/Controllers/ResourceBookingController.php:177
>>>>>>> Stashed changes
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
 * @route '/bookings/{booking}/cancel'
 */
cancel.patch = (args: { booking: number | { id: number } } | [booking: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: cancel.url(args, options),
    method: 'patch',
})

<<<<<<< HEAD
    /**
* @see \App\Http\Controllers\ResourceBookingController::cancel
 * @see app/Http/Controllers/ResourceBookingController.php:347
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
 * @see app/Http/Controllers/ResourceBookingController.php:347
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
=======
<<<<<<< Updated upstream
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
/**
* @see \App\Http\Controllers\ResourceBookingController::showCheckout
 * @see app/Http/Controllers/ResourceBookingController.php:198
 * @route '/bookings/{booking}/checkout'
=======
    /**
* @see \App\Http\Controllers\ResourceBookingController::cancel
 * @see app/Http/Controllers/ResourceBookingController.php:177
 * @route '/bookings/{booking}/cancel'
>>>>>>> Stashed changes
 */
export const showCheckout = (args: { booking: number | { id: number } } | [booking: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: showCheckout.url(args, options),
    method: 'get',
})

<<<<<<< Updated upstream
showCheckout.definition = {
    methods: ["get","head"],
    url: '/bookings/{booking}/checkout',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ResourceBookingController::showCheckout
 * @see app/Http/Controllers/ResourceBookingController.php:198
 * @route '/bookings/{booking}/checkout'
=======
            /**
* @see \App\Http\Controllers\ResourceBookingController::cancel
 * @see app/Http/Controllers/ResourceBookingController.php:177
 * @route '/bookings/{booking}/cancel'
>>>>>>> Stashed changes
 */
showCheckout.url = (args: { booking: number | { id: number } } | [booking: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return showCheckout.definition.url
            .replace('{booking}', parsedArgs.booking.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ResourceBookingController::showCheckout
 * @see app/Http/Controllers/ResourceBookingController.php:198
 * @route '/bookings/{booking}/checkout'
 */
showCheckout.get = (args: { booking: number | { id: number } } | [booking: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: showCheckout.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ResourceBookingController::showCheckout
 * @see app/Http/Controllers/ResourceBookingController.php:198
 * @route '/bookings/{booking}/checkout'
 */
showCheckout.head = (args: { booking: number | { id: number } } | [booking: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: showCheckout.url(args, options),
    method: 'head',
})

<<<<<<< HEAD
    /**
* @see \App\Http\Controllers\ResourceBookingController::showCheckout
 * @see app/Http/Controllers/ResourceBookingController.php:198
 * @route '/bookings/{booking}/checkout'
 */
    const showCheckoutForm = (args: { booking: number | { id: number } } | [booking: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: showCheckout.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ResourceBookingController::showCheckout
 * @see app/Http/Controllers/ResourceBookingController.php:198
 * @route '/bookings/{booking}/checkout'
 */
        showCheckoutForm.get = (args: { booking: number | { id: number } } | [booking: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: showCheckout.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ResourceBookingController::showCheckout
 * @see app/Http/Controllers/ResourceBookingController.php:198
 * @route '/bookings/{booking}/checkout'
 */
        showCheckoutForm.head = (args: { booking: number | { id: number } } | [booking: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: showCheckout.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    showCheckout.form = showCheckoutForm
=======
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
/**
* @see \App\Http\Controllers\ResourceBookingController::checkout
 * @see app/Http/Controllers/ResourceBookingController.php:230
 * @route '/bookings/{booking}/checkout'
 */
export const checkout = (args: { booking: number | { id: number } } | [booking: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: checkout.url(args, options),
    method: 'post',
})

checkout.definition = {
    methods: ["post"],
    url: '/bookings/{booking}/checkout',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ResourceBookingController::checkout
 * @see app/Http/Controllers/ResourceBookingController.php:230
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
 * @see app/Http/Controllers/ResourceBookingController.php:230
 * @route '/bookings/{booking}/checkout'
 */
checkout.post = (args: { booking: number | { id: number } } | [booking: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: checkout.url(args, options),
    method: 'post',
})
<<<<<<< HEAD

    /**
* @see \App\Http\Controllers\ResourceBookingController::checkout
 * @see app/Http/Controllers/ResourceBookingController.php:230
 * @route '/bookings/{booking}/checkout'
 */
    const checkoutForm = (args: { booking: number | { id: number } } | [booking: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: checkout.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ResourceBookingController::checkout
 * @see app/Http/Controllers/ResourceBookingController.php:230
 * @route '/bookings/{booking}/checkout'
 */
        checkoutForm.post = (args: { booking: number | { id: number } } | [booking: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: checkout.url(args, options),
            method: 'post',
        })
    
    checkout.form = checkoutForm
=======
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
const ResourceBookingController = { storeBulk, calendar, closeDate, reopenDate, markPaid, searchCustomers, storeWalkIn, index, create, store, show, cancel, showCheckout, checkout }

export default ResourceBookingController