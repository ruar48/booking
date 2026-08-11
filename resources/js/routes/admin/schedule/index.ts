import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../wayfinder'
import blocks from './blocks'
import recurringLocks from './recurring-locks'
/**
* @see \App\Http\Controllers\Admin\ScheduleSettingController::index
 * @see app/Http/Controllers/Admin/ScheduleSettingController.php:19
 * @route '/admin/schedule'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/schedule',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\ScheduleSettingController::index
 * @see app/Http/Controllers/Admin/ScheduleSettingController.php:19
 * @route '/admin/schedule'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ScheduleSettingController::index
 * @see app/Http/Controllers/Admin/ScheduleSettingController.php:19
 * @route '/admin/schedule'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\ScheduleSettingController::index
 * @see app/Http/Controllers/Admin/ScheduleSettingController.php:19
 * @route '/admin/schedule'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\ScheduleSettingController::index
 * @see app/Http/Controllers/Admin/ScheduleSettingController.php:19
 * @route '/admin/schedule'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\ScheduleSettingController::index
 * @see app/Http/Controllers/Admin/ScheduleSettingController.php:19
 * @route '/admin/schedule'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\ScheduleSettingController::index
 * @see app/Http/Controllers/Admin/ScheduleSettingController.php:19
 * @route '/admin/schedule'
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
/**
* @see \App\Http\Controllers\Admin\ScheduleSettingController::updateHours
 * @see app/Http/Controllers/Admin/ScheduleSettingController.php:44
 * @route '/admin/schedule/hours'
 */
export const updateHours = (options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateHours.url(options),
    method: 'put',
})

updateHours.definition = {
    methods: ["put"],
    url: '/admin/schedule/hours',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Admin\ScheduleSettingController::updateHours
 * @see app/Http/Controllers/Admin/ScheduleSettingController.php:44
 * @route '/admin/schedule/hours'
 */
updateHours.url = (options?: RouteQueryOptions) => {
    return updateHours.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ScheduleSettingController::updateHours
 * @see app/Http/Controllers/Admin/ScheduleSettingController.php:44
 * @route '/admin/schedule/hours'
 */
updateHours.put = (options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateHours.url(options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Admin\ScheduleSettingController::updateHours
 * @see app/Http/Controllers/Admin/ScheduleSettingController.php:44
 * @route '/admin/schedule/hours'
 */
    const updateHoursForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updateHours.url({
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\ScheduleSettingController::updateHours
 * @see app/Http/Controllers/Admin/ScheduleSettingController.php:44
 * @route '/admin/schedule/hours'
 */
        updateHoursForm.put = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateHours.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    updateHours.form = updateHoursForm
/**
* @see \App\Http\Controllers\Admin\ScheduleSettingController::updatePaymentWindow
 * @see app/Http/Controllers/Admin/ScheduleSettingController.php:58
 * @route '/admin/schedule/payment-window'
 */
export const updatePaymentWindow = (options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updatePaymentWindow.url(options),
    method: 'put',
})

updatePaymentWindow.definition = {
    methods: ["put"],
    url: '/admin/schedule/payment-window',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Admin\ScheduleSettingController::updatePaymentWindow
 * @see app/Http/Controllers/Admin/ScheduleSettingController.php:58
 * @route '/admin/schedule/payment-window'
 */
updatePaymentWindow.url = (options?: RouteQueryOptions) => {
    return updatePaymentWindow.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ScheduleSettingController::updatePaymentWindow
 * @see app/Http/Controllers/Admin/ScheduleSettingController.php:58
 * @route '/admin/schedule/payment-window'
 */
updatePaymentWindow.put = (options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updatePaymentWindow.url(options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Admin\ScheduleSettingController::updatePaymentWindow
 * @see app/Http/Controllers/Admin/ScheduleSettingController.php:58
 * @route '/admin/schedule/payment-window'
 */
    const updatePaymentWindowForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updatePaymentWindow.url({
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\ScheduleSettingController::updatePaymentWindow
 * @see app/Http/Controllers/Admin/ScheduleSettingController.php:58
 * @route '/admin/schedule/payment-window'
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
const schedule = {
    index: Object.assign(index, index),
updateHours: Object.assign(updateHours, updateHours),
updatePaymentWindow: Object.assign(updatePaymentWindow, updatePaymentWindow),
blocks: Object.assign(blocks, blocks),
recurringLocks: Object.assign(recurringLocks, recurringLocks),
}

export default schedule