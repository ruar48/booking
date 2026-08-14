import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../wayfinder'
/**
* @see \App\Http\Controllers\SessionController::index
 * @see app/Http/Controllers/SessionController.php:14
 * @route '/settings/sessions'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/settings/sessions',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SessionController::index
 * @see app/Http/Controllers/SessionController.php:14
 * @route '/settings/sessions'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SessionController::index
 * @see app/Http/Controllers/SessionController.php:14
 * @route '/settings/sessions'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\SessionController::index
 * @see app/Http/Controllers/SessionController.php:14
 * @route '/settings/sessions'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\SessionController::index
 * @see app/Http/Controllers/SessionController.php:14
 * @route '/settings/sessions'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\SessionController::index
 * @see app/Http/Controllers/SessionController.php:14
 * @route '/settings/sessions'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\SessionController::index
 * @see app/Http/Controllers/SessionController.php:14
 * @route '/settings/sessions'
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
* @see \App\Http\Controllers\SessionController::destroy
 * @see app/Http/Controllers/SessionController.php:38
 * @route '/settings/sessions/{session}'
 */
export const destroy = (args: { session: string | number } | [session: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/settings/sessions/{session}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\SessionController::destroy
 * @see app/Http/Controllers/SessionController.php:38
 * @route '/settings/sessions/{session}'
 */
destroy.url = (args: { session: string | number } | [session: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { session: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    session: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        session: args.session,
                }

    return destroy.definition.url
            .replace('{session}', parsedArgs.session.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\SessionController::destroy
 * @see app/Http/Controllers/SessionController.php:38
 * @route '/settings/sessions/{session}'
 */
destroy.delete = (args: { session: string | number } | [session: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\SessionController::destroy
 * @see app/Http/Controllers/SessionController.php:38
 * @route '/settings/sessions/{session}'
 */
    const destroyForm = (args: { session: string | number } | [session: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\SessionController::destroy
 * @see app/Http/Controllers/SessionController.php:38
 * @route '/settings/sessions/{session}'
 */
        destroyForm.delete = (args: { session: string | number } | [session: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
const sessions = {
    index: Object.assign(index, index),
destroy: Object.assign(destroy, destroy),
}

export default sessions