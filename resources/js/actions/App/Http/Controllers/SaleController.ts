import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
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
const SaleController = { index, show }

export default SaleController