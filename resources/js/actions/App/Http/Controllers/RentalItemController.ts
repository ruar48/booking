import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\RentalItemController::index
 * @see app/Http/Controllers/RentalItemController.php:22
 * @route '/rental-items'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/rental-items',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\RentalItemController::index
 * @see app/Http/Controllers/RentalItemController.php:22
 * @route '/rental-items'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\RentalItemController::index
 * @see app/Http/Controllers/RentalItemController.php:22
 * @route '/rental-items'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\RentalItemController::index
 * @see app/Http/Controllers/RentalItemController.php:22
 * @route '/rental-items'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\RentalItemController::create
 * @see app/Http/Controllers/RentalItemController.php:40
 * @route '/rental-items/create'
 */
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/rental-items/create',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\RentalItemController::create
 * @see app/Http/Controllers/RentalItemController.php:40
 * @route '/rental-items/create'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\RentalItemController::create
 * @see app/Http/Controllers/RentalItemController.php:40
 * @route '/rental-items/create'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\RentalItemController::create
 * @see app/Http/Controllers/RentalItemController.php:40
 * @route '/rental-items/create'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\RentalItemController::store
 * @see app/Http/Controllers/RentalItemController.php:47
 * @route '/rental-items'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/rental-items',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\RentalItemController::store
 * @see app/Http/Controllers/RentalItemController.php:47
 * @route '/rental-items'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\RentalItemController::store
 * @see app/Http/Controllers/RentalItemController.php:47
 * @route '/rental-items'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\RentalItemController::edit
 * @see app/Http/Controllers/RentalItemController.php:56
 * @route '/rental-items/{rental_item}/edit'
 */
export const edit = (args: { rental_item: number | { id: number } } | [rental_item: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})

edit.definition = {
    methods: ["get","head"],
    url: '/rental-items/{rental_item}/edit',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\RentalItemController::edit
 * @see app/Http/Controllers/RentalItemController.php:56
 * @route '/rental-items/{rental_item}/edit'
 */
edit.url = (args: { rental_item: number | { id: number } } | [rental_item: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { rental_item: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { rental_item: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    rental_item: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        rental_item: typeof args.rental_item === 'object'
                ? args.rental_item.id
                : args.rental_item,
                }

    return edit.definition.url
            .replace('{rental_item}', parsedArgs.rental_item.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\RentalItemController::edit
 * @see app/Http/Controllers/RentalItemController.php:56
 * @route '/rental-items/{rental_item}/edit'
 */
edit.get = (args: { rental_item: number | { id: number } } | [rental_item: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\RentalItemController::edit
 * @see app/Http/Controllers/RentalItemController.php:56
 * @route '/rental-items/{rental_item}/edit'
 */
edit.head = (args: { rental_item: number | { id: number } } | [rental_item: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: edit.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\RentalItemController::update
 * @see app/Http/Controllers/RentalItemController.php:65
 * @route '/rental-items/{rental_item}'
 */
export const update = (args: { rental_item: number | { id: number } } | [rental_item: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put","patch"],
    url: '/rental-items/{rental_item}',
} satisfies RouteDefinition<["put","patch"]>

/**
* @see \App\Http\Controllers\RentalItemController::update
 * @see app/Http/Controllers/RentalItemController.php:65
 * @route '/rental-items/{rental_item}'
 */
update.url = (args: { rental_item: number | { id: number } } | [rental_item: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { rental_item: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { rental_item: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    rental_item: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        rental_item: typeof args.rental_item === 'object'
                ? args.rental_item.id
                : args.rental_item,
                }

    return update.definition.url
            .replace('{rental_item}', parsedArgs.rental_item.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\RentalItemController::update
 * @see app/Http/Controllers/RentalItemController.php:65
 * @route '/rental-items/{rental_item}'
 */
update.put = (args: { rental_item: number | { id: number } } | [rental_item: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})
/**
* @see \App\Http\Controllers\RentalItemController::update
 * @see app/Http/Controllers/RentalItemController.php:65
 * @route '/rental-items/{rental_item}'
 */
update.patch = (args: { rental_item: number | { id: number } } | [rental_item: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\RentalItemController::destroy
 * @see app/Http/Controllers/RentalItemController.php:74
 * @route '/rental-items/{rental_item}'
 */
export const destroy = (args: { rental_item: number | { id: number } } | [rental_item: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/rental-items/{rental_item}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\RentalItemController::destroy
 * @see app/Http/Controllers/RentalItemController.php:74
 * @route '/rental-items/{rental_item}'
 */
destroy.url = (args: { rental_item: number | { id: number } } | [rental_item: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { rental_item: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { rental_item: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    rental_item: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        rental_item: typeof args.rental_item === 'object'
                ? args.rental_item.id
                : args.rental_item,
                }

    return destroy.definition.url
            .replace('{rental_item}', parsedArgs.rental_item.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\RentalItemController::destroy
 * @see app/Http/Controllers/RentalItemController.php:74
 * @route '/rental-items/{rental_item}'
 */
destroy.delete = (args: { rental_item: number | { id: number } } | [rental_item: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\RentalItemController::adjustStock
 * @see app/Http/Controllers/RentalItemController.php:85
 * @route '/rental-items/{rental_item}/adjust-stock'
 */
export const adjustStock = (args: { rental_item: number | { id: number } } | [rental_item: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: adjustStock.url(args, options),
    method: 'post',
})

adjustStock.definition = {
    methods: ["post"],
    url: '/rental-items/{rental_item}/adjust-stock',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\RentalItemController::adjustStock
 * @see app/Http/Controllers/RentalItemController.php:85
 * @route '/rental-items/{rental_item}/adjust-stock'
 */
adjustStock.url = (args: { rental_item: number | { id: number } } | [rental_item: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { rental_item: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { rental_item: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    rental_item: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        rental_item: typeof args.rental_item === 'object'
                ? args.rental_item.id
                : args.rental_item,
                }

    return adjustStock.definition.url
            .replace('{rental_item}', parsedArgs.rental_item.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\RentalItemController::adjustStock
 * @see app/Http/Controllers/RentalItemController.php:85
 * @route '/rental-items/{rental_item}/adjust-stock'
 */
adjustStock.post = (args: { rental_item: number | { id: number } } | [rental_item: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: adjustStock.url(args, options),
    method: 'post',
})
const RentalItemController = { index, create, store, edit, update, destroy, adjustStock }

export default RentalItemController