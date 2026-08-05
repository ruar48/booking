import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
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
const join = {
    store: Object.assign(store, store),
}

export default join