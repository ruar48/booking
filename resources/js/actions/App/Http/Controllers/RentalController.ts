import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../../wayfinder'
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
const RentalController = { checkout, store }

export default RentalController