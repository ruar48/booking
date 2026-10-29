import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\HomeController::index
 * @see app/Http/Controllers/HomeController.php:16
 * @route '/'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\HomeController::index
 * @see app/Http/Controllers/HomeController.php:16
 * @route '/'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\HomeController::index
 * @see app/Http/Controllers/HomeController.php:16
 * @route '/'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\HomeController::index
 * @see app/Http/Controllers/HomeController.php:16
 * @route '/'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\HomeController::index
 * @see app/Http/Controllers/HomeController.php:16
 * @route '/'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\HomeController::index
 * @see app/Http/Controllers/HomeController.php:16
 * @route '/'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\HomeController::index
 * @see app/Http/Controllers/HomeController.php:16
 * @route '/'
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
* @see \App\Http\Controllers\HomeController::llms
 * @see app/Http/Controllers/HomeController.php:28
 * @route '/llms.txt'
 */
export const llms = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: llms.url(options),
    method: 'get',
})

llms.definition = {
    methods: ["get","head"],
    url: '/llms.txt',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\HomeController::llms
 * @see app/Http/Controllers/HomeController.php:28
 * @route '/llms.txt'
 */
llms.url = (options?: RouteQueryOptions) => {
    return llms.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\HomeController::llms
 * @see app/Http/Controllers/HomeController.php:28
 * @route '/llms.txt'
 */
llms.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: llms.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\HomeController::llms
 * @see app/Http/Controllers/HomeController.php:28
 * @route '/llms.txt'
 */
llms.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: llms.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\HomeController::llms
 * @see app/Http/Controllers/HomeController.php:28
 * @route '/llms.txt'
 */
    const llmsForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: llms.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\HomeController::llms
 * @see app/Http/Controllers/HomeController.php:28
 * @route '/llms.txt'
 */
        llmsForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: llms.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\HomeController::llms
 * @see app/Http/Controllers/HomeController.php:28
 * @route '/llms.txt'
 */
        llmsForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: llms.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    llms.form = llmsForm
const HomeController = { index, llms }

export default HomeController