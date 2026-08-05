import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\OpenPlayTargetScoreController::update
 * @see app/Http/Controllers/OpenPlayTargetScoreController.php:12
 * @route '/open-play/{open_play}/target-score'
 */
export const update = (args: { open_play: number | { id: number } } | [open_play: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

update.definition = {
    methods: ["patch"],
    url: '/open-play/{open_play}/target-score',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\OpenPlayTargetScoreController::update
 * @see app/Http/Controllers/OpenPlayTargetScoreController.php:12
 * @route '/open-play/{open_play}/target-score'
 */
update.url = (args: { open_play: number | { id: number } } | [open_play: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return update.definition.url
            .replace('{open_play}', parsedArgs.open_play.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\OpenPlayTargetScoreController::update
 * @see app/Http/Controllers/OpenPlayTargetScoreController.php:12
 * @route '/open-play/{open_play}/target-score'
 */
update.patch = (args: { open_play: number | { id: number } } | [open_play: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\OpenPlayTargetScoreController::update
 * @see app/Http/Controllers/OpenPlayTargetScoreController.php:12
 * @route '/open-play/{open_play}/target-score'
 */
    const updateForm = (args: { open_play: number | { id: number } } | [open_play: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PATCH',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\OpenPlayTargetScoreController::update
 * @see app/Http/Controllers/OpenPlayTargetScoreController.php:12
 * @route '/open-play/{open_play}/target-score'
 */
        updateForm.patch = (args: { open_play: number | { id: number } } | [open_play: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PATCH',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    update.form = updateForm
const targetScore = {
    update: Object.assign(update, update),
}

export default targetScore