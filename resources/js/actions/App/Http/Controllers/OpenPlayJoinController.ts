import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\OpenPlayJoinController::browse
 * @see app/Http/Controllers/OpenPlayJoinController.php:20
 * @route '/open-play/browse'
 */
export const browse = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: browse.url(options),
    method: 'get',
})

browse.definition = {
    methods: ["get","head"],
    url: '/open-play/browse',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\OpenPlayJoinController::browse
 * @see app/Http/Controllers/OpenPlayJoinController.php:20
 * @route '/open-play/browse'
 */
browse.url = (options?: RouteQueryOptions) => {
    return browse.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\OpenPlayJoinController::browse
 * @see app/Http/Controllers/OpenPlayJoinController.php:20
 * @route '/open-play/browse'
 */
browse.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: browse.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\OpenPlayJoinController::browse
 * @see app/Http/Controllers/OpenPlayJoinController.php:20
 * @route '/open-play/browse'
 */
browse.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: browse.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\OpenPlayJoinController::browse
 * @see app/Http/Controllers/OpenPlayJoinController.php:20
 * @route '/open-play/browse'
 */
    const browseForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: browse.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\OpenPlayJoinController::browse
 * @see app/Http/Controllers/OpenPlayJoinController.php:20
 * @route '/open-play/browse'
 */
        browseForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: browse.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\OpenPlayJoinController::browse
 * @see app/Http/Controllers/OpenPlayJoinController.php:20
 * @route '/open-play/browse'
 */
        browseForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: browse.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    browse.form = browseForm
/**
* @see \App\Http\Controllers\OpenPlayJoinController::mine
 * @see app/Http/Controllers/OpenPlayJoinController.php:47
 * @route '/open-play/{open_play}/mine'
 */
export const mine = (args: { open_play: number | { id: number } } | [open_play: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: mine.url(args, options),
    method: 'get',
})

mine.definition = {
    methods: ["get","head"],
    url: '/open-play/{open_play}/mine',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\OpenPlayJoinController::mine
 * @see app/Http/Controllers/OpenPlayJoinController.php:47
 * @route '/open-play/{open_play}/mine'
 */
mine.url = (args: { open_play: number | { id: number } } | [open_play: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { open_play: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { open_play: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    open_play: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        open_play: typeof args.open_play === 'object'
                ? args.open_play.id
                : args.open_play,
                }

    return mine.definition.url
            .replace('{open_play}', parsedArgs.open_play.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\OpenPlayJoinController::mine
 * @see app/Http/Controllers/OpenPlayJoinController.php:47
 * @route '/open-play/{open_play}/mine'
 */
mine.get = (args: { open_play: number | { id: number } } | [open_play: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: mine.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\OpenPlayJoinController::mine
 * @see app/Http/Controllers/OpenPlayJoinController.php:47
 * @route '/open-play/{open_play}/mine'
 */
mine.head = (args: { open_play: number | { id: number } } | [open_play: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: mine.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\OpenPlayJoinController::mine
 * @see app/Http/Controllers/OpenPlayJoinController.php:47
 * @route '/open-play/{open_play}/mine'
 */
    const mineForm = (args: { open_play: number | { id: number } } | [open_play: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: mine.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\OpenPlayJoinController::mine
 * @see app/Http/Controllers/OpenPlayJoinController.php:47
 * @route '/open-play/{open_play}/mine'
 */
        mineForm.get = (args: { open_play: number | { id: number } } | [open_play: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: mine.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\OpenPlayJoinController::mine
 * @see app/Http/Controllers/OpenPlayJoinController.php:47
 * @route '/open-play/{open_play}/mine'
 */
        mineForm.head = (args: { open_play: number | { id: number } } | [open_play: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: mine.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    mine.form = mineForm
/**
* @see \App\Http\Controllers\OpenPlayJoinController::join
 * @see app/Http/Controllers/OpenPlayJoinController.php:80
 * @route '/open-play/{open_play}/join'
 */
export const join = (args: { open_play: number | { id: number } } | [open_play: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: join.url(args, options),
    method: 'get',
})

join.definition = {
    methods: ["get","head"],
    url: '/open-play/{open_play}/join',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\OpenPlayJoinController::join
 * @see app/Http/Controllers/OpenPlayJoinController.php:80
 * @route '/open-play/{open_play}/join'
 */
join.url = (args: { open_play: number | { id: number } } | [open_play: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { open_play: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { open_play: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    open_play: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        open_play: typeof args.open_play === 'object'
                ? args.open_play.id
                : args.open_play,
                }

    return join.definition.url
            .replace('{open_play}', parsedArgs.open_play.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\OpenPlayJoinController::join
 * @see app/Http/Controllers/OpenPlayJoinController.php:80
 * @route '/open-play/{open_play}/join'
 */
join.get = (args: { open_play: number | { id: number } } | [open_play: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: join.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\OpenPlayJoinController::join
 * @see app/Http/Controllers/OpenPlayJoinController.php:80
 * @route '/open-play/{open_play}/join'
 */
join.head = (args: { open_play: number | { id: number } } | [open_play: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: join.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\OpenPlayJoinController::join
 * @see app/Http/Controllers/OpenPlayJoinController.php:80
 * @route '/open-play/{open_play}/join'
 */
    const joinForm = (args: { open_play: number | { id: number } } | [open_play: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: join.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\OpenPlayJoinController::join
 * @see app/Http/Controllers/OpenPlayJoinController.php:80
 * @route '/open-play/{open_play}/join'
 */
        joinForm.get = (args: { open_play: number | { id: number } } | [open_play: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: join.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\OpenPlayJoinController::join
 * @see app/Http/Controllers/OpenPlayJoinController.php:80
 * @route '/open-play/{open_play}/join'
 */
        joinForm.head = (args: { open_play: number | { id: number } } | [open_play: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: join.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    join.form = joinForm
/**
* @see \App\Http\Controllers\OpenPlayJoinController::store
 * @see app/Http/Controllers/OpenPlayJoinController.php:100
 * @route '/open-play/{open_play}/join'
 */
export const store = (args: { open_play: number | { id: number } } | [open_play: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/open-play/{open_play}/join',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\OpenPlayJoinController::store
 * @see app/Http/Controllers/OpenPlayJoinController.php:100
 * @route '/open-play/{open_play}/join'
 */
store.url = (args: { open_play: number | { id: number } } | [open_play: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { open_play: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { open_play: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    open_play: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        open_play: typeof args.open_play === 'object'
                ? args.open_play.id
                : args.open_play,
                }

    return store.definition.url
            .replace('{open_play}', parsedArgs.open_play.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\OpenPlayJoinController::store
 * @see app/Http/Controllers/OpenPlayJoinController.php:100
 * @route '/open-play/{open_play}/join'
 */
store.post = (args: { open_play: number | { id: number } } | [open_play: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\OpenPlayJoinController::store
 * @see app/Http/Controllers/OpenPlayJoinController.php:100
 * @route '/open-play/{open_play}/join'
 */
    const storeForm = (args: { open_play: number | { id: number } } | [open_play: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\OpenPlayJoinController::store
 * @see app/Http/Controllers/OpenPlayJoinController.php:100
 * @route '/open-play/{open_play}/join'
 */
        storeForm.post = (args: { open_play: number | { id: number } } | [open_play: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(args, options),
            method: 'post',
        })
    
    store.form = storeForm
const OpenPlayJoinController = { browse, mine, join, store }

export default OpenPlayJoinController