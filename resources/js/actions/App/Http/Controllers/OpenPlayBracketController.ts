import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\OpenPlayBracketController::generate
 * @see app/Http/Controllers/OpenPlayBracketController.php:16
 * @route '/open-play/{open_play}/bracket/generate'
 */
export const generate = (args: { open_play: number | { id: number } } | [open_play: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: generate.url(args, options),
    method: 'post',
})

generate.definition = {
    methods: ["post"],
    url: '/open-play/{open_play}/bracket/generate',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\OpenPlayBracketController::generate
 * @see app/Http/Controllers/OpenPlayBracketController.php:16
 * @route '/open-play/{open_play}/bracket/generate'
 */
generate.url = (args: { open_play: number | { id: number } } | [open_play: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return generate.definition.url
            .replace('{open_play}', parsedArgs.open_play.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\OpenPlayBracketController::generate
 * @see app/Http/Controllers/OpenPlayBracketController.php:16
 * @route '/open-play/{open_play}/bracket/generate'
 */
generate.post = (args: { open_play: number | { id: number } } | [open_play: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: generate.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\OpenPlayBracketController::generate
 * @see app/Http/Controllers/OpenPlayBracketController.php:16
 * @route '/open-play/{open_play}/bracket/generate'
 */
    const generateForm = (args: { open_play: number | { id: number } } | [open_play: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: generate.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\OpenPlayBracketController::generate
 * @see app/Http/Controllers/OpenPlayBracketController.php:16
 * @route '/open-play/{open_play}/bracket/generate'
 */
        generateForm.post = (args: { open_play: number | { id: number } } | [open_play: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: generate.url(args, options),
            method: 'post',
        })
    
    generate.form = generateForm
/**
* @see \App\Http\Controllers\OpenPlayBracketController::reset
 * @see app/Http/Controllers/OpenPlayBracketController.php:33
 * @route '/open-play/{open_play}/bracket'
 */
export const reset = (args: { open_play: number | { id: number } } | [open_play: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: reset.url(args, options),
    method: 'delete',
})

reset.definition = {
    methods: ["delete"],
    url: '/open-play/{open_play}/bracket',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\OpenPlayBracketController::reset
 * @see app/Http/Controllers/OpenPlayBracketController.php:33
 * @route '/open-play/{open_play}/bracket'
 */
reset.url = (args: { open_play: number | { id: number } } | [open_play: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return reset.definition.url
            .replace('{open_play}', parsedArgs.open_play.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\OpenPlayBracketController::reset
 * @see app/Http/Controllers/OpenPlayBracketController.php:33
 * @route '/open-play/{open_play}/bracket'
 */
reset.delete = (args: { open_play: number | { id: number } } | [open_play: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: reset.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\OpenPlayBracketController::reset
 * @see app/Http/Controllers/OpenPlayBracketController.php:33
 * @route '/open-play/{open_play}/bracket'
 */
    const resetForm = (args: { open_play: number | { id: number } } | [open_play: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: reset.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\OpenPlayBracketController::reset
 * @see app/Http/Controllers/OpenPlayBracketController.php:33
 * @route '/open-play/{open_play}/bracket'
 */
        resetForm.delete = (args: { open_play: number | { id: number } } | [open_play: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: reset.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    reset.form = resetForm
const OpenPlayBracketController = { generate, reset }

export default OpenPlayBracketController