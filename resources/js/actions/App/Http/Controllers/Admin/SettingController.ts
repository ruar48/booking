import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\SettingController::index
 * @see app/Http/Controllers/Admin/SettingController.php:16
 * @route '/admin/settings'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/settings',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\SettingController::index
 * @see app/Http/Controllers/Admin/SettingController.php:16
 * @route '/admin/settings'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SettingController::index
 * @see app/Http/Controllers/Admin/SettingController.php:16
 * @route '/admin/settings'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\SettingController::index
 * @see app/Http/Controllers/Admin/SettingController.php:16
 * @route '/admin/settings'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\SettingController::update
 * @see app/Http/Controllers/Admin/SettingController.php:50
 * @route '/admin/settings'
 */
export const update = (options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/admin/settings',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Admin\SettingController::update
 * @see app/Http/Controllers/Admin/SettingController.php:50
 * @route '/admin/settings'
 */
update.url = (options?: RouteQueryOptions) => {
    return update.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SettingController::update
 * @see app/Http/Controllers/Admin/SettingController.php:50
 * @route '/admin/settings'
 */
update.put = (options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\Admin\SettingController::updatePaymentWindow
 * @see app/Http/Controllers/Admin/SettingController.php:78
 * @route '/admin/settings/payment-window'
 */
export const updatePaymentWindow = (options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updatePaymentWindow.url(options),
    method: 'put',
})

updatePaymentWindow.definition = {
    methods: ["put"],
    url: '/admin/settings/payment-window',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Admin\SettingController::updatePaymentWindow
 * @see app/Http/Controllers/Admin/SettingController.php:78
 * @route '/admin/settings/payment-window'
 */
updatePaymentWindow.url = (options?: RouteQueryOptions) => {
    return updatePaymentWindow.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SettingController::updatePaymentWindow
 * @see app/Http/Controllers/Admin/SettingController.php:78
 * @route '/admin/settings/payment-window'
 */
updatePaymentWindow.put = (options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updatePaymentWindow.url(options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\Admin\SettingController::updateNotifications
 * @see app/Http/Controllers/Admin/SettingController.php:96
 * @route '/admin/settings/notifications'
 */
export const updateNotifications = (options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateNotifications.url(options),
    method: 'put',
})

updateNotifications.definition = {
    methods: ["put"],
    url: '/admin/settings/notifications',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Admin\SettingController::updateNotifications
 * @see app/Http/Controllers/Admin/SettingController.php:96
 * @route '/admin/settings/notifications'
 */
updateNotifications.url = (options?: RouteQueryOptions) => {
    return updateNotifications.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SettingController::updateNotifications
 * @see app/Http/Controllers/Admin/SettingController.php:96
 * @route '/admin/settings/notifications'
 */
updateNotifications.put = (options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateNotifications.url(options),
    method: 'put',
})
const SettingController = { index, update, updatePaymentWindow, updateNotifications }

export default SettingController