import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\ResourceBookingController::search
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
export const search = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: search.url(options),
    method: 'get',
})

search.definition = {
    methods: ["get","head"],
    url: '/bookings/customers/search',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ResourceBookingController::search
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
search.url = (options?: RouteQueryOptions) => {
    return search.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ResourceBookingController::search
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
search.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: search.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ResourceBookingController::search
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
search.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: search.url(options),
    method: 'head',
})
<<<<<<< Updated upstream
=======

    /**
* @see \App\Http\Controllers\ResourceBookingController::search
<<<<<<< HEAD
 * @see app/Http/Controllers/ResourceBookingController.php:174
=======
 * @see app/Http/Controllers/ResourceBookingController.php:135
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
 * @route '/bookings/customers/search'
 */
    const searchForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: search.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ResourceBookingController::search
<<<<<<< HEAD
 * @see app/Http/Controllers/ResourceBookingController.php:174
=======
 * @see app/Http/Controllers/ResourceBookingController.php:135
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
 * @route '/bookings/customers/search'
 */
        searchForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: search.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ResourceBookingController::search
<<<<<<< HEAD
 * @see app/Http/Controllers/ResourceBookingController.php:174
=======
 * @see app/Http/Controllers/ResourceBookingController.php:135
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
 * @route '/bookings/customers/search'
 */
        searchForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: search.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    search.form = searchForm
>>>>>>> Stashed changes
const customers = {
    search: Object.assign(search, search),
}

export default customers