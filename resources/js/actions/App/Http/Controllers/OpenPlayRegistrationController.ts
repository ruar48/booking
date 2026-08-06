import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\OpenPlayRegistrationController::store
 * @see app/Http/Controllers/OpenPlayRegistrationController.php:20
 * @route '/open-play/{open_play}/registrations'
 */
export const store = (args: { open_play: number | { id: number } } | [open_play: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/open-play/{open_play}/registrations',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\OpenPlayRegistrationController::store
 * @see app/Http/Controllers/OpenPlayRegistrationController.php:20
 * @route '/open-play/{open_play}/registrations'
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
* @see \App\Http\Controllers\OpenPlayRegistrationController::store
 * @see app/Http/Controllers/OpenPlayRegistrationController.php:20
 * @route '/open-play/{open_play}/registrations'
 */
store.post = (args: { open_play: number | { id: number } } | [open_play: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\OpenPlayRegistrationController::store
 * @see app/Http/Controllers/OpenPlayRegistrationController.php:20
 * @route '/open-play/{open_play}/registrations'
 */
    const storeForm = (args: { open_play: number | { id: number } } | [open_play: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\OpenPlayRegistrationController::store
 * @see app/Http/Controllers/OpenPlayRegistrationController.php:20
 * @route '/open-play/{open_play}/registrations'
 */
        storeForm.post = (args: { open_play: number | { id: number } } | [open_play: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(args, options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\OpenPlayRegistrationController::pairRandom
 * @see app/Http/Controllers/OpenPlayRegistrationController.php:47
 * @route '/open-play/{open_play}/registrations/pair-random'
 */
export const pairRandom = (args: { open_play: number | { id: number } } | [open_play: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: pairRandom.url(args, options),
    method: 'post',
})

pairRandom.definition = {
    methods: ["post"],
    url: '/open-play/{open_play}/registrations/pair-random',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\OpenPlayRegistrationController::pairRandom
 * @see app/Http/Controllers/OpenPlayRegistrationController.php:47
 * @route '/open-play/{open_play}/registrations/pair-random'
 */
pairRandom.url = (args: { open_play: number | { id: number } } | [open_play: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return pairRandom.definition.url
            .replace('{open_play}', parsedArgs.open_play.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\OpenPlayRegistrationController::pairRandom
 * @see app/Http/Controllers/OpenPlayRegistrationController.php:47
 * @route '/open-play/{open_play}/registrations/pair-random'
 */
pairRandom.post = (args: { open_play: number | { id: number } } | [open_play: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: pairRandom.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\OpenPlayRegistrationController::pairRandom
 * @see app/Http/Controllers/OpenPlayRegistrationController.php:47
 * @route '/open-play/{open_play}/registrations/pair-random'
 */
    const pairRandomForm = (args: { open_play: number | { id: number } } | [open_play: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: pairRandom.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\OpenPlayRegistrationController::pairRandom
 * @see app/Http/Controllers/OpenPlayRegistrationController.php:47
 * @route '/open-play/{open_play}/registrations/pair-random'
 */
        pairRandomForm.post = (args: { open_play: number | { id: number } } | [open_play: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: pairRandom.url(args, options),
            method: 'post',
        })
    
    pairRandom.form = pairRandomForm
/**
* @see \App\Http\Controllers\OpenPlayRegistrationController::destroy
 * @see app/Http/Controllers/OpenPlayRegistrationController.php:63
 * @route '/open-play-registrations/{registration}'
 */
export const destroy = (args: { registration: number | { id: number } } | [registration: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/open-play-registrations/{registration}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\OpenPlayRegistrationController::destroy
 * @see app/Http/Controllers/OpenPlayRegistrationController.php:63
 * @route '/open-play-registrations/{registration}'
 */
destroy.url = (args: { registration: number | { id: number } } | [registration: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { registration: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { registration: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    registration: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        registration: typeof args.registration === 'object'
                ? args.registration.id
                : args.registration,
                }

    return destroy.definition.url
            .replace('{registration}', parsedArgs.registration.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\OpenPlayRegistrationController::destroy
 * @see app/Http/Controllers/OpenPlayRegistrationController.php:63
 * @route '/open-play-registrations/{registration}'
 */
destroy.delete = (args: { registration: number | { id: number } } | [registration: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\OpenPlayRegistrationController::destroy
 * @see app/Http/Controllers/OpenPlayRegistrationController.php:63
 * @route '/open-play-registrations/{registration}'
 */
    const destroyForm = (args: { registration: number | { id: number } } | [registration: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\OpenPlayRegistrationController::destroy
 * @see app/Http/Controllers/OpenPlayRegistrationController.php:63
 * @route '/open-play-registrations/{registration}'
 */
        destroyForm.delete = (args: { registration: number | { id: number } } | [registration: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
/**
* @see \App\Http\Controllers\OpenPlayRegistrationController::updatePayment
 * @see app/Http/Controllers/OpenPlayRegistrationController.php:74
 * @route '/open-play-registrations/{registration}/payment'
 */
export const updatePayment = (args: { registration: number | { id: number } } | [registration: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: updatePayment.url(args, options),
    method: 'patch',
})

updatePayment.definition = {
    methods: ["patch"],
    url: '/open-play-registrations/{registration}/payment',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\OpenPlayRegistrationController::updatePayment
 * @see app/Http/Controllers/OpenPlayRegistrationController.php:74
 * @route '/open-play-registrations/{registration}/payment'
 */
updatePayment.url = (args: { registration: number | { id: number } } | [registration: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { registration: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { registration: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    registration: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        registration: typeof args.registration === 'object'
                ? args.registration.id
                : args.registration,
                }

    return updatePayment.definition.url
            .replace('{registration}', parsedArgs.registration.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\OpenPlayRegistrationController::updatePayment
 * @see app/Http/Controllers/OpenPlayRegistrationController.php:74
 * @route '/open-play-registrations/{registration}/payment'
 */
updatePayment.patch = (args: { registration: number | { id: number } } | [registration: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: updatePayment.url(args, options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\OpenPlayRegistrationController::updatePayment
 * @see app/Http/Controllers/OpenPlayRegistrationController.php:74
 * @route '/open-play-registrations/{registration}/payment'
 */
    const updatePaymentForm = (args: { registration: number | { id: number } } | [registration: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updatePayment.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PATCH',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\OpenPlayRegistrationController::updatePayment
 * @see app/Http/Controllers/OpenPlayRegistrationController.php:74
 * @route '/open-play-registrations/{registration}/payment'
 */
        updatePaymentForm.patch = (args: { registration: number | { id: number } } | [registration: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updatePayment.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PATCH',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    updatePayment.form = updatePaymentForm
const OpenPlayRegistrationController = { store, pairRandom, destroy, updatePayment }

export default OpenPlayRegistrationController