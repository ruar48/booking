import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../../wayfinder'
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
* @see \App\Http\Controllers\Admin\ScheduleSettingController::updateHours
 * @see app/Http/Controllers/Admin/ScheduleSettingController.php:43
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
 * @see app/Http/Controllers/Admin/ScheduleSettingController.php:43
 * @route '/admin/schedule/hours'
 */
updateHours.url = (options?: RouteQueryOptions) => {
    return updateHours.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ScheduleSettingController::updateHours
 * @see app/Http/Controllers/Admin/ScheduleSettingController.php:43
 * @route '/admin/schedule/hours'
 */
updateHours.put = (options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateHours.url(options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\Admin\ScheduleSettingController::storeBlock
 * @see app/Http/Controllers/Admin/ScheduleSettingController.php:57
 * @route '/admin/schedule/blocks'
 */
export const storeBlock = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeBlock.url(options),
    method: 'post',
})

storeBlock.definition = {
    methods: ["post"],
    url: '/admin/schedule/blocks',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ScheduleSettingController::storeBlock
 * @see app/Http/Controllers/Admin/ScheduleSettingController.php:57
 * @route '/admin/schedule/blocks'
 */
storeBlock.url = (options?: RouteQueryOptions) => {
    return storeBlock.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ScheduleSettingController::storeBlock
 * @see app/Http/Controllers/Admin/ScheduleSettingController.php:57
 * @route '/admin/schedule/blocks'
 */
storeBlock.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeBlock.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Admin\ScheduleSettingController::destroyBlock
 * @see app/Http/Controllers/Admin/ScheduleSettingController.php:76
 * @route '/admin/schedule/blocks/{block}'
 */
export const destroyBlock = (args: { block: number | { id: number } } | [block: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroyBlock.url(args, options),
    method: 'delete',
})

destroyBlock.definition = {
    methods: ["delete"],
    url: '/admin/schedule/blocks/{block}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Admin\ScheduleSettingController::destroyBlock
 * @see app/Http/Controllers/Admin/ScheduleSettingController.php:76
 * @route '/admin/schedule/blocks/{block}'
 */
destroyBlock.url = (args: { block: number | { id: number } } | [block: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { block: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { block: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    block: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        block: typeof args.block === 'object'
                ? args.block.id
                : args.block,
                }

    return destroyBlock.definition.url
            .replace('{block}', parsedArgs.block.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ScheduleSettingController::destroyBlock
 * @see app/Http/Controllers/Admin/ScheduleSettingController.php:76
 * @route '/admin/schedule/blocks/{block}'
 */
destroyBlock.delete = (args: { block: number | { id: number } } | [block: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroyBlock.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\Admin\ScheduleSettingController::toggle
 * @see app/Http/Controllers/Admin/ScheduleSettingController.php:85
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
 * @see app/Http/Controllers/Admin/ScheduleSettingController.php:85
 * @route '/admin/schedule/recurring-locks/toggle'
 */
toggle.url = (options?: RouteQueryOptions) => {
    return toggle.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ScheduleSettingController::toggle
 * @see app/Http/Controllers/Admin/ScheduleSettingController.php:85
 * @route '/admin/schedule/recurring-locks/toggle'
 */
toggle.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: toggle.url(options),
    method: 'post',
})
const ScheduleSettingController = { index, updateHours, storeBlock, destroyBlock, toggle }

export default ScheduleSettingController