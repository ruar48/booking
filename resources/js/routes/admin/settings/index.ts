import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../wayfinder'
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

<<<<<<< HEAD
    /**
* @see \App\Http\Controllers\Admin\SettingController::index
 * @see app/Http/Controllers/Admin/SettingController.php:16
 * @route '/admin/settings'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\SettingController::index
 * @see app/Http/Controllers/Admin/SettingController.php:16
 * @route '/admin/settings'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\SettingController::index
 * @see app/Http/Controllers/Admin/SettingController.php:16
 * @route '/admin/settings'
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
=======
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
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

<<<<<<< HEAD
    /**
* @see \App\Http\Controllers\Admin\SettingController::update
 * @see app/Http/Controllers/Admin/SettingController.php:50
 * @route '/admin/settings'
 */
    const updateForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url({
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\SettingController::update
 * @see app/Http/Controllers/Admin/SettingController.php:50
 * @route '/admin/settings'
 */
        updateForm.put = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    update.form = updateForm
=======
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
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

<<<<<<< HEAD
    /**
* @see \App\Http\Controllers\Admin\SettingController::updatePaymentWindow
 * @see app/Http/Controllers/Admin/SettingController.php:78
 * @route '/admin/settings/payment-window'
=======
/**
* @see \App\Http\Controllers\Admin\SettingController::updateNotifications
 * @see app/Http/Controllers/Admin/SettingController.php:96
 * @route '/admin/settings/notifications'
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
 */
export const updateNotifications = (options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateNotifications.url(options),
    method: 'put',
})

<<<<<<< HEAD
            /**
* @see \App\Http\Controllers\Admin\SettingController::updatePaymentWindow
 * @see app/Http/Controllers/Admin/SettingController.php:78
 * @route '/admin/settings/payment-window'
 */
        updatePaymentWindowForm.put = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updatePaymentWindow.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    updatePaymentWindow.form = updatePaymentWindowForm
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
=======
updateNotifications.definition = {
    methods: ["put"],
    url: '/admin/settings/notifications',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Admin\SettingController::updateNotifications
 * @see app/Http/Controllers/Admin/SettingController.php:96
 * @route '/admin/settings/notifications'
 */
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
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
<<<<<<< HEAD

    /**
* @see \App\Http\Controllers\Admin\SettingController::updateNotifications
 * @see app/Http/Controllers/Admin/SettingController.php:96
 * @route '/admin/settings/notifications'
 */
    const updateNotificationsForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updateNotifications.url({
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\SettingController::updateNotifications
 * @see app/Http/Controllers/Admin/SettingController.php:96
 * @route '/admin/settings/notifications'
 */
        updateNotificationsForm.put = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateNotifications.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    updateNotifications.form = updateNotificationsForm
=======
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
const settings = {
    index: Object.assign(index, index),
update: Object.assign(update, update),
updatePaymentWindow: Object.assign(updatePaymentWindow, updatePaymentWindow),
updateNotifications: Object.assign(updateNotifications, updateNotifications),
}

export default settings