import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\OpenPlayBracketMatchController::store
 * @see app/Http/Controllers/OpenPlayBracketMatchController.php:20
 * @route '/open-play/{open_play}/bracket/matches'
 */
export const store = (args: { open_play: number | { id: number } } | [open_play: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/open-play/{open_play}/bracket/matches',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\OpenPlayBracketMatchController::store
 * @see app/Http/Controllers/OpenPlayBracketMatchController.php:20
 * @route '/open-play/{open_play}/bracket/matches'
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
* @see \App\Http\Controllers\OpenPlayBracketMatchController::store
 * @see app/Http/Controllers/OpenPlayBracketMatchController.php:20
 * @route '/open-play/{open_play}/bracket/matches'
 */
store.post = (args: { open_play: number | { id: number } } | [open_play: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\OpenPlayBracketMatchController::store
 * @see app/Http/Controllers/OpenPlayBracketMatchController.php:20
 * @route '/open-play/{open_play}/bracket/matches'
 */
    const storeForm = (args: { open_play: number | { id: number } } | [open_play: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\OpenPlayBracketMatchController::store
 * @see app/Http/Controllers/OpenPlayBracketMatchController.php:20
 * @route '/open-play/{open_play}/bracket/matches'
 */
        storeForm.post = (args: { open_play: number | { id: number } } | [open_play: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(args, options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\OpenPlayBracketMatchController::destroy
 * @see app/Http/Controllers/OpenPlayBracketMatchController.php:54
 * @route '/open-play-bracket-matches/{match}'
 */
export const destroy = (args: { match: number | { id: number } } | [match: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/open-play-bracket-matches/{match}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\OpenPlayBracketMatchController::destroy
 * @see app/Http/Controllers/OpenPlayBracketMatchController.php:54
 * @route '/open-play-bracket-matches/{match}'
 */
destroy.url = (args: { match: number | { id: number } } | [match: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { match: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { match: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    match: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        match: typeof args.match === 'object'
                ? args.match.id
                : args.match,
                }

    return destroy.definition.url
            .replace('{match}', parsedArgs.match.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\OpenPlayBracketMatchController::destroy
 * @see app/Http/Controllers/OpenPlayBracketMatchController.php:54
 * @route '/open-play-bracket-matches/{match}'
 */
destroy.delete = (args: { match: number | { id: number } } | [match: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\OpenPlayBracketMatchController::destroy
 * @see app/Http/Controllers/OpenPlayBracketMatchController.php:54
 * @route '/open-play-bracket-matches/{match}'
 */
    const destroyForm = (args: { match: number | { id: number } } | [match: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\OpenPlayBracketMatchController::destroy
 * @see app/Http/Controllers/OpenPlayBracketMatchController.php:54
 * @route '/open-play-bracket-matches/{match}'
 */
        destroyForm.delete = (args: { match: number | { id: number } } | [match: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
const OpenPlayBracketMatchController = { store, destroy }

export default OpenPlayBracketMatchController