import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\ReportController::sales
 * @see app/Http/Controllers/ReportController.php:24
 * @route '/pos/reports'
 */
export const sales = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: sales.url(options),
    method: 'get',
})

sales.definition = {
    methods: ["get","head"],
    url: '/pos/reports',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ReportController::sales
 * @see app/Http/Controllers/ReportController.php:24
 * @route '/pos/reports'
 */
sales.url = (options?: RouteQueryOptions) => {
    return sales.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReportController::sales
 * @see app/Http/Controllers/ReportController.php:24
 * @route '/pos/reports'
 */
sales.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: sales.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ReportController::sales
 * @see app/Http/Controllers/ReportController.php:24
 * @route '/pos/reports'
 */
sales.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: sales.url(options),
    method: 'head',
})
const ReportController = { sales }

export default ReportController