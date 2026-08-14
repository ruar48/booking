import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\AuditLogController::index
 * @see app/Http/Controllers/Admin/AuditLogController.php:14
 * @route '/admin/audit-logs'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/audit-logs',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\AuditLogController::index
 * @see app/Http/Controllers/Admin/AuditLogController.php:14
 * @route '/admin/audit-logs'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\AuditLogController::index
 * @see app/Http/Controllers/Admin/AuditLogController.php:14
 * @route '/admin/audit-logs'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\AuditLogController::index
 * @see app/Http/Controllers/Admin/AuditLogController.php:14
 * @route '/admin/audit-logs'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})
const AuditLogController = { index }

export default AuditLogController