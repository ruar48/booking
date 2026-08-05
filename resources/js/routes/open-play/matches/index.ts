import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\OpenPlayMatchController::updateScore
 * @see app/Http/Controllers/OpenPlayMatchController.php:18
 * @route '/open-play-matches/{match}/score'
 */
export const updateScore = (args: { match: number | { id: number } } | [match: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: updateScore.url(args, options),
    method: 'patch',
})

updateScore.definition = {
    methods: ["patch"],
    url: '/open-play-matches/{match}/score',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\OpenPlayMatchController::updateScore
 * @see app/Http/Controllers/OpenPlayMatchController.php:18
 * @route '/open-play-matches/{match}/score'
 */
updateScore.url = (args: { match: number | { id: number } } | [match: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return updateScore.definition.url
            .replace('{match}', parsedArgs.match.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\OpenPlayMatchController::updateScore
 * @see app/Http/Controllers/OpenPlayMatchController.php:18
 * @route '/open-play-matches/{match}/score'
 */
updateScore.patch = (args: { match: number | { id: number } } | [match: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: updateScore.url(args, options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\OpenPlayMatchController::updateScore
 * @see app/Http/Controllers/OpenPlayMatchController.php:18
 * @route '/open-play-matches/{match}/score'
 */
    const updateScoreForm = (args: { match: number | { id: number } } | [match: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updateScore.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PATCH',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\OpenPlayMatchController::updateScore
 * @see app/Http/Controllers/OpenPlayMatchController.php:18
 * @route '/open-play-matches/{match}/score'
 */
        updateScoreForm.patch = (args: { match: number | { id: number } } | [match: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateScore.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PATCH',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    updateScore.form = updateScoreForm
const matches = {
    updateScore: Object.assign(updateScore, updateScore),
}

export default matches