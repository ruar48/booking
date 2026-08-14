import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\ResourceController::index
 * @see app/Http/Controllers/ResourceController.php:19
 * @route '/resources'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/resources',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ResourceController::index
 * @see app/Http/Controllers/ResourceController.php:19
 * @route '/resources'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ResourceController::index
 * @see app/Http/Controllers/ResourceController.php:19
 * @route '/resources'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ResourceController::index
 * @see app/Http/Controllers/ResourceController.php:19
 * @route '/resources'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ResourceController::create
 * @see app/Http/Controllers/ResourceController.php:28
 * @route '/resources/create'
 */
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/resources/create',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ResourceController::create
 * @see app/Http/Controllers/ResourceController.php:28
 * @route '/resources/create'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ResourceController::create
 * @see app/Http/Controllers/ResourceController.php:28
 * @route '/resources/create'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ResourceController::create
 * @see app/Http/Controllers/ResourceController.php:28
 * @route '/resources/create'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ResourceController::store
 * @see app/Http/Controllers/ResourceController.php:35
 * @route '/resources'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/resources',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ResourceController::store
 * @see app/Http/Controllers/ResourceController.php:35
 * @route '/resources'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ResourceController::store
 * @see app/Http/Controllers/ResourceController.php:35
 * @route '/resources'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ResourceController::edit
 * @see app/Http/Controllers/ResourceController.php:44
 * @route '/resources/{resource}/edit'
 */
export const edit = (args: { resource: number | { id: number } } | [resource: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})

edit.definition = {
    methods: ["get","head"],
    url: '/resources/{resource}/edit',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ResourceController::edit
 * @see app/Http/Controllers/ResourceController.php:44
 * @route '/resources/{resource}/edit'
 */
edit.url = (args: { resource: number | { id: number } } | [resource: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { resource: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { resource: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    resource: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        resource: typeof args.resource === 'object'
                ? args.resource.id
                : args.resource,
                }

    return edit.definition.url
            .replace('{resource}', parsedArgs.resource.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ResourceController::edit
 * @see app/Http/Controllers/ResourceController.php:44
 * @route '/resources/{resource}/edit'
 */
edit.get = (args: { resource: number | { id: number } } | [resource: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ResourceController::edit
 * @see app/Http/Controllers/ResourceController.php:44
 * @route '/resources/{resource}/edit'
 */
edit.head = (args: { resource: number | { id: number } } | [resource: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: edit.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ResourceController::update
 * @see app/Http/Controllers/ResourceController.php:53
 * @route '/resources/{resource}'
 */
export const update = (args: { resource: number | { id: number } } | [resource: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put","patch"],
    url: '/resources/{resource}',
} satisfies RouteDefinition<["put","patch"]>

/**
* @see \App\Http\Controllers\ResourceController::update
 * @see app/Http/Controllers/ResourceController.php:53
 * @route '/resources/{resource}'
 */
update.url = (args: { resource: number | { id: number } } | [resource: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { resource: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { resource: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    resource: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        resource: typeof args.resource === 'object'
                ? args.resource.id
                : args.resource,
                }

    return update.definition.url
            .replace('{resource}', parsedArgs.resource.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ResourceController::update
 * @see app/Http/Controllers/ResourceController.php:53
 * @route '/resources/{resource}'
 */
update.put = (args: { resource: number | { id: number } } | [resource: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})
/**
* @see \App\Http\Controllers\ResourceController::update
 * @see app/Http/Controllers/ResourceController.php:53
 * @route '/resources/{resource}'
 */
update.patch = (args: { resource: number | { id: number } } | [resource: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\ResourceController::destroy
 * @see app/Http/Controllers/ResourceController.php:62
 * @route '/resources/{resource}'
 */
export const destroy = (args: { resource: number | { id: number } } | [resource: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/resources/{resource}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\ResourceController::destroy
 * @see app/Http/Controllers/ResourceController.php:62
 * @route '/resources/{resource}'
 */
destroy.url = (args: { resource: number | { id: number } } | [resource: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { resource: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { resource: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    resource: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        resource: typeof args.resource === 'object'
                ? args.resource.id
                : args.resource,
                }

    return destroy.definition.url
            .replace('{resource}', parsedArgs.resource.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ResourceController::destroy
 * @see app/Http/Controllers/ResourceController.php:62
 * @route '/resources/{resource}'
 */
destroy.delete = (args: { resource: number | { id: number } } | [resource: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})
const ResourceController = { index, create, store, edit, update, destroy }

export default ResourceController