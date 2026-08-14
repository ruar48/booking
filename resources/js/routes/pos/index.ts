import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../wayfinder'
import sales from './sales'
/**
* @see \App\Http\Controllers\PosController::checkout
 * @see app/Http/Controllers/PosController.php:27
 * @route '/pos'
 */
export const checkout = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: checkout.url(options),
    method: 'get',
})

checkout.definition = {
    methods: ["get","head"],
    url: '/pos',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PosController::checkout
 * @see app/Http/Controllers/PosController.php:27
 * @route '/pos'
 */
checkout.url = (options?: RouteQueryOptions) => {
    return checkout.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\PosController::checkout
 * @see app/Http/Controllers/PosController.php:27
 * @route '/pos'
 */
checkout.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: checkout.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PosController::checkout
 * @see app/Http/Controllers/PosController.php:27
 * @route '/pos'
 */
checkout.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: checkout.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ReportController::reports
 * @see app/Http/Controllers/ReportController.php:24
 * @route '/pos/reports'
 */
export const reports = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: reports.url(options),
    method: 'get',
})

reports.definition = {
    methods: ["get","head"],
    url: '/pos/reports',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ReportController::reports
 * @see app/Http/Controllers/ReportController.php:24
 * @route '/pos/reports'
 */
reports.url = (options?: RouteQueryOptions) => {
    return reports.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReportController::reports
 * @see app/Http/Controllers/ReportController.php:24
 * @route '/pos/reports'
 */
reports.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: reports.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ReportController::reports
 * @see app/Http/Controllers/ReportController.php:24
 * @route '/pos/reports'
 */
reports.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: reports.url(options),
    method: 'head',
})
const pos = {
    checkout: Object.assign(checkout, checkout),
sales: Object.assign(sales, sales),
reports: Object.assign(reports, reports),
}

export default pos