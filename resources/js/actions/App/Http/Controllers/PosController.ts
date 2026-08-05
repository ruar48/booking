import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\PosController::checkout
 * @see app/Http/Controllers/PosController.php:27
 * @route '/pos'
 */
export const checkout = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: checkout.url(options),
    method: 'get',
})

checkout.definition = {
    methods: ["get","head"],
    url: '/pos',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PosController::checkout
 * @see app/Http/Controllers/PosController.php:27
 * @route '/pos'
 */
checkout.url = (options?: RouteQueryOptions) => {
    return checkout.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\PosController::checkout
 * @see app/Http/Controllers/PosController.php:27
 * @route '/pos'
 */
checkout.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: checkout.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PosController::checkout
 * @see app/Http/Controllers/PosController.php:27
 * @route '/pos'
 */
checkout.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: checkout.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PosController::checkout
 * @see app/Http/Controllers/PosController.php:27
 * @route '/pos'
 */
    const checkoutForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: checkout.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PosController::checkout
 * @see app/Http/Controllers/PosController.php:27
 * @route '/pos'
 */
        checkoutForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: checkout.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PosController::checkout
 * @see app/Http/Controllers/PosController.php:27
 * @route '/pos'
 */
        checkoutForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: checkout.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    checkout.form = checkoutForm
/**
* @see \App\Http\Controllers\PosController::store
 * @see app/Http/Controllers/PosController.php:54
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
 * @see app/Http/Controllers/PosController.php:54
 * @route '/pos/sales'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\PosController::store
 * @see app/Http/Controllers/PosController.php:54
 * @route '/pos/sales'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\PosController::store
 * @see app/Http/Controllers/PosController.php:54
 * @route '/pos/sales'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\PosController::store
 * @see app/Http/Controllers/PosController.php:54
 * @route '/pos/sales'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\PosController::voidMethod
 * @see app/Http/Controllers/PosController.php:77
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
 * @see app/Http/Controllers/PosController.php:77
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
 * @see app/Http/Controllers/PosController.php:77
 * @route '/pos/sales/{sale}/void'
 */
voidMethod.patch = (args: { sale: number | { id: number } } | [sale: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: voidMethod.url(args, options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\PosController::voidMethod
 * @see app/Http/Controllers/PosController.php:77
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
 * @see app/Http/Controllers/PosController.php:77
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
const PosController = { checkout, store, voidMethod, void: voidMethod }

export default PosController