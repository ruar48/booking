import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\ScheduleSettingController::toggle
 * @see app/Http/Controllers/Admin/ScheduleSettingController.php:102
 * @route '/admin/schedule/recurring-locks/toggle'
 */
export const toggle = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: toggle.url(options),
    method: 'post',
})

toggle.definition = {
    methods: ["post"],
    url: '/admin/schedule/recurring-locks/toggle',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ScheduleSettingController::toggle
 * @see app/Http/Controllers/Admin/ScheduleSettingController.php:102
 * @route '/admin/schedule/recurring-locks/toggle'
 */
toggle.url = (options?: RouteQueryOptions) => {
    return toggle.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ScheduleSettingController::toggle
 * @see app/Http/Controllers/Admin/ScheduleSettingController.php:102
 * @route '/admin/schedule/recurring-locks/toggle'
 */
toggle.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: toggle.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\ScheduleSettingController::toggle
 * @see app/Http/Controllers/Admin/ScheduleSettingController.php:102
 * @route '/admin/schedule/recurring-locks/toggle'
 */
    const toggleForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: toggle.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\ScheduleSettingController::toggle
 * @see app/Http/Controllers/Admin/ScheduleSettingController.php:102
 * @route '/admin/schedule/recurring-locks/toggle'
 */
        toggleForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: toggle.url(options),
            method: 'post',
        })
    
    toggle.form = toggleForm
const recurringLocks = {
    toggle: Object.assign(toggle, toggle),
}

export default recurringLocks