import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../wayfinder'
import transactions from './transactions'
import report611039 from './report'
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
* @see \App\Http\Controllers\RentalMemberController::rent
 * @see app/Http/Controllers/RentalMemberController.php:48
 * @route '/rentals/rent'
 */
export const rent = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: rent.url(options),
    method: 'post',
})

rent.definition = {
    methods: ["post"],
    url: '/rentals/rent',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\RentalMemberController::rent
 * @see app/Http/Controllers/RentalMemberController.php:48
 * @route '/rentals/rent'
 */
rent.url = (options?: RouteQueryOptions) => {
    return rent.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\RentalMemberController::rent
 * @see app/Http/Controllers/RentalMemberController.php:48
 * @route '/rentals/rent'
 */
rent.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: rent.url(options),
    method: 'post',
})

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

/**
* @see \App\Http\Controllers\RentalTransactionController::report
 * @see app/Http/Controllers/RentalTransactionController.php:45
 * @route '/rentals/report'
 */
export const report = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: report.url(options),
    method: 'get',
})

report.definition = {
    methods: ["get","head"],
    url: '/rentals/report',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\RentalTransactionController::report
 * @see app/Http/Controllers/RentalTransactionController.php:45
 * @route '/rentals/report'
 */
report.url = (options?: RouteQueryOptions) => {
    return report.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\RentalTransactionController::report
 * @see app/Http/Controllers/RentalTransactionController.php:45
 * @route '/rentals/report'
 */
report.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: report.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\RentalTransactionController::report
 * @see app/Http/Controllers/RentalTransactionController.php:45
 * @route '/rentals/report'
 */
report.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: report.url(options),
    method: 'head',
})
const rentals = {
    browse: Object.assign(browse, browse),
mine: Object.assign(mine, mine),
rent: Object.assign(rent, rent),
checkout: Object.assign(checkout, checkout),
store: Object.assign(store, store),
transactions: Object.assign(transactions, transactions),
report: Object.assign(report, report611039),
}

export default rentals