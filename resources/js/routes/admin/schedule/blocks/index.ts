import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\ScheduleSettingController::store
 * @see app/Http/Controllers/Admin/ScheduleSettingController.php:57
 * @route '/admin/schedule/blocks'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/admin/schedule/blocks',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\ScheduleSettingController::store
 * @see app/Http/Controllers/Admin/ScheduleSettingController.php:57
 * @route '/admin/schedule/blocks'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ScheduleSettingController::store
 * @see app/Http/Controllers/Admin/ScheduleSettingController.php:57
 * @route '/admin/schedule/blocks'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\ScheduleSettingController::store
 * @see app/Http/Controllers/Admin/ScheduleSettingController.php:57
 * @route '/admin/schedule/blocks'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\ScheduleSettingController::store
 * @see app/Http/Controllers/Admin/ScheduleSettingController.php:57
 * @route '/admin/schedule/blocks'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\Admin\ScheduleSettingController::destroy
 * @see app/Http/Controllers/Admin/ScheduleSettingController.php:76
 * @route '/admin/schedule/blocks/{block}'
 */
export const destroy = (args: { block: number | { id: number } } | [block: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/admin/schedule/blocks/{block}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Admin\ScheduleSettingController::destroy
 * @see app/Http/Controllers/Admin/ScheduleSettingController.php:76
 * @route '/admin/schedule/blocks/{block}'
 */
destroy.url = (args: { block: number | { id: number } } | [block: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return destroy.definition.url
            .replace('{block}', parsedArgs.block.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ScheduleSettingController::destroy
 * @see app/Http/Controllers/Admin/ScheduleSettingController.php:76
 * @route '/admin/schedule/blocks/{block}'
 */
destroy.delete = (args: { block: number | { id: number } } | [block: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\Admin\ScheduleSettingController::destroy
 * @see app/Http/Controllers/Admin/ScheduleSettingController.php:76
 * @route '/admin/schedule/blocks/{block}'
 */
    const destroyForm = (args: { block: number | { id: number } } | [block: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\ScheduleSettingController::destroy
 * @see app/Http/Controllers/Admin/ScheduleSettingController.php:76
 * @route '/admin/schedule/blocks/{block}'
 */
        destroyForm.delete = (args: { block: number | { id: number } } | [block: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
const blocks = {
    store: Object.assign(store, store),
destroy: Object.assign(destroy, destroy),
}

export default blocks