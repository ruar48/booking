import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\RentalController::checkout
 * @see app/Http/Controllers/RentalController.php:22
 * @route '/rentals'
 */
export const checkout = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: checkout.url(options),
    method: 'get',
})

checkout.definition = {
    methods: ["get","head"],
    url: '/rentals',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\RentalController::checkout
 * @see app/Http/Controllers/RentalController.php:22
 * @route '/rentals'
 */
checkout.url = (options?: RouteQueryOptions) => {
    return checkout.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\RentalController::checkout
 * @see app/Http/Controllers/RentalController.php:22
 * @route '/rentals'
 */
checkout.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: checkout.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\RentalController::checkout
 * @see app/Http/Controllers/RentalController.php:22
 * @route '/rentals'
 */
checkout.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: checkout.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\RentalController::checkout
 * @see app/Http/Controllers/RentalController.php:22
 * @route '/rentals'
 */
    const checkoutForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: checkout.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\RentalController::checkout
 * @see app/Http/Controllers/RentalController.php:22
 * @route '/rentals'
 */
        checkoutForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: checkout.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\RentalController::checkout
 * @see app/Http/Controllers/RentalController.php:22
 * @route '/rentals'
 */
        checkoutForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: checkout.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    checkout.form = checkoutForm
/**
* @see \App\Http\Controllers\RentalController::store
 * @see app/Http/Controllers/RentalController.php:36
 * @route '/rentals'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/rentals',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\RentalController::store
 * @see app/Http/Controllers/RentalController.php:36
 * @route '/rentals'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\RentalController::store
 * @see app/Http/Controllers/RentalController.php:36
 * @route '/rentals'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\RentalController::store
 * @see app/Http/Controllers/RentalController.php:36
 * @route '/rentals'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\RentalController::store
 * @see app/Http/Controllers/RentalController.php:36
 * @route '/rentals'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
const RentalController = { checkout, store }

export default RentalController