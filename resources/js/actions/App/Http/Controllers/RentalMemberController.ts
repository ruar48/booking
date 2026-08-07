import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\RentalMemberController::browse
 * @see app/Http/Controllers/RentalMemberController.php:23
 * @route '/rentals/browse'
 */
export const browse = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: browse.url(options),
    method: 'get',
})

browse.definition = {
    methods: ["get","head"],
    url: '/rentals/browse',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\RentalMemberController::browse
 * @see app/Http/Controllers/RentalMemberController.php:23
 * @route '/rentals/browse'
 */
browse.url = (options?: RouteQueryOptions) => {
    return browse.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\RentalMemberController::browse
 * @see app/Http/Controllers/RentalMemberController.php:23
 * @route '/rentals/browse'
 */
browse.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: browse.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\RentalMemberController::browse
 * @see app/Http/Controllers/RentalMemberController.php:23
 * @route '/rentals/browse'
 */
browse.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: browse.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\RentalMemberController::mine
 * @see app/Http/Controllers/RentalMemberController.php:35
 * @route '/rentals/mine'
 */
export const mine = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: mine.url(options),
    method: 'get',
})

mine.definition = {
    methods: ["get","head"],
    url: '/rentals/mine',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\RentalMemberController::mine
 * @see app/Http/Controllers/RentalMemberController.php:35
 * @route '/rentals/mine'
 */
mine.url = (options?: RouteQueryOptions) => {
    return mine.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\RentalMemberController::mine
 * @see app/Http/Controllers/RentalMemberController.php:35
 * @route '/rentals/mine'
 */
mine.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: mine.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\RentalMemberController::mine
 * @see app/Http/Controllers/RentalMemberController.php:35
 * @route '/rentals/mine'
 */
mine.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: mine.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\RentalMemberController::store
 * @see app/Http/Controllers/RentalMemberController.php:48
 * @route '/rentals/rent'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/rentals/rent',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\RentalMemberController::store
 * @see app/Http/Controllers/RentalMemberController.php:48
 * @route '/rentals/rent'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\RentalMemberController::store
 * @see app/Http/Controllers/RentalMemberController.php:48
 * @route '/rentals/rent'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})
const RentalMemberController = { browse, mine, store }

export default RentalMemberController