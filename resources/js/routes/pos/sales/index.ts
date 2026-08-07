import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\PosController::store
 * @see app/Http/Controllers/PosController.php:45
 * @route '/pos/sales'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/pos/sales',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\PosController::store
 * @see app/Http/Controllers/PosController.php:45
 * @route '/pos/sales'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\PosController::store
 * @see app/Http/Controllers/PosController.php:45
 * @route '/pos/sales'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\PosController::store
 * @see app/Http/Controllers/PosController.php:45
 * @route '/pos/sales'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\PosController::store
 * @see app/Http/Controllers/PosController.php:45
 * @route '/pos/sales'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\PosController::voidMethod
 * @see app/Http/Controllers/PosController.php:67
 * @route '/pos/sales/{sale}/void'
 */
export const voidMethod = (args: { sale: number | { id: number } } | [sale: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: voidMethod.url(args, options),
    method: 'patch',
})

voidMethod.definition = {
    methods: ["patch"],
    url: '/pos/sales/{sale}/void',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\PosController::voidMethod
 * @see app/Http/Controllers/PosController.php:67
 * @route '/pos/sales/{sale}/void'
 */
voidMethod.url = (args: { sale: number | { id: number } } | [sale: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { sale: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { sale: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    sale: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        sale: typeof args.sale === 'object'
                ? args.sale.id
                : args.sale,
                }

    return voidMethod.definition.url
            .replace('{sale}', parsedArgs.sale.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PosController::voidMethod
 * @see app/Http/Controllers/PosController.php:67
 * @route '/pos/sales/{sale}/void'
 */
voidMethod.patch = (args: { sale: number | { id: number } } | [sale: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: voidMethod.url(args, options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\PosController::voidMethod
 * @see app/Http/Controllers/PosController.php:67
 * @route '/pos/sales/{sale}/void'
 */
    const voidMethodForm = (args: { sale: number | { id: number } } | [sale: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: voidMethod.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PATCH',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\PosController::voidMethod
 * @see app/Http/Controllers/PosController.php:67
 * @route '/pos/sales/{sale}/void'
 */
        voidMethodForm.patch = (args: { sale: number | { id: number } } | [sale: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: voidMethod.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PATCH',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    voidMethod.form = voidMethodForm
/**
* @see \App\Http\Controllers\SaleController::index
 * @see app/Http/Controllers/SaleController.php:17
 * @route '/pos/sales'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/pos/sales',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SaleController::index
 * @see app/Http/Controllers/SaleController.php:17
 * @route '/pos/sales'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SaleController::index
 * @see app/Http/Controllers/SaleController.php:17
 * @route '/pos/sales'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\SaleController::index
 * @see app/Http/Controllers/SaleController.php:17
 * @route '/pos/sales'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\SaleController::index
 * @see app/Http/Controllers/SaleController.php:17
 * @route '/pos/sales'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\SaleController::index
 * @see app/Http/Controllers/SaleController.php:17
 * @route '/pos/sales'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\SaleController::index
 * @see app/Http/Controllers/SaleController.php:17
 * @route '/pos/sales'
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
* @see \App\Http\Controllers\SaleController::show
 * @see app/Http/Controllers/SaleController.php:29
 * @route '/pos/sales/{sale}'
 */
export const show = (args: { sale: number | { id: number } } | [sale: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/pos/sales/{sale}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SaleController::show
 * @see app/Http/Controllers/SaleController.php:29
 * @route '/pos/sales/{sale}'
 */
show.url = (args: { sale: number | { id: number } } | [sale: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { sale: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { sale: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    sale: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        sale: typeof args.sale === 'object'
                ? args.sale.id
                : args.sale,
                }

    return show.definition.url
            .replace('{sale}', parsedArgs.sale.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\SaleController::show
 * @see app/Http/Controllers/SaleController.php:29
 * @route '/pos/sales/{sale}'
 */
show.get = (args: { sale: number | { id: number } } | [sale: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\SaleController::show
 * @see app/Http/Controllers/SaleController.php:29
 * @route '/pos/sales/{sale}'
 */
show.head = (args: { sale: number | { id: number } } | [sale: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\SaleController::show
 * @see app/Http/Controllers/SaleController.php:29
 * @route '/pos/sales/{sale}'
 */
    const showForm = (args: { sale: number | { id: number } } | [sale: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\SaleController::show
 * @see app/Http/Controllers/SaleController.php:29
 * @route '/pos/sales/{sale}'
 */
        showForm.get = (args: { sale: number | { id: number } } | [sale: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\SaleController::show
 * @see app/Http/Controllers/SaleController.php:29
 * @route '/pos/sales/{sale}'
 */
        showForm.head = (args: { sale: number | { id: number } } | [sale: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    show.form = showForm
const sales = {
    store: Object.assign(store, store),
void: Object.assign(voidMethod, voidMethod),
index: Object.assign(index, index),
show: Object.assign(show, show),
}

export default sales