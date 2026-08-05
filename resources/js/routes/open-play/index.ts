import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../wayfinder'
import join0c68bd from './join'
import players from './players'
import registrations from './registrations'
import bracket from './bracket'
import targetScore from './target-score'
import matches from './matches'
import bracketMatches from './bracket-matches'
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
* @see \App\Http\Controllers\OpenPlayController::index
 * @see app/Http/Controllers/OpenPlayController.php:18
 * @route '/open-play'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/open-play',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\OpenPlayController::index
 * @see app/Http/Controllers/OpenPlayController.php:18
 * @route '/open-play'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\OpenPlayController::index
 * @see app/Http/Controllers/OpenPlayController.php:18
 * @route '/open-play'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\OpenPlayController::index
 * @see app/Http/Controllers/OpenPlayController.php:18
 * @route '/open-play'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\OpenPlayController::index
 * @see app/Http/Controllers/OpenPlayController.php:18
 * @route '/open-play'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\OpenPlayController::index
 * @see app/Http/Controllers/OpenPlayController.php:18
 * @route '/open-play'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\OpenPlayController::index
 * @see app/Http/Controllers/OpenPlayController.php:18
 * @route '/open-play'
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
* @see \App\Http\Controllers\OpenPlayController::create
 * @see app/Http/Controllers/OpenPlayController.php:41
 * @route '/open-play/create'
 */
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/open-play/create',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\OpenPlayController::create
 * @see app/Http/Controllers/OpenPlayController.php:41
 * @route '/open-play/create'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\OpenPlayController::create
 * @see app/Http/Controllers/OpenPlayController.php:41
 * @route '/open-play/create'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\OpenPlayController::create
 * @see app/Http/Controllers/OpenPlayController.php:41
 * @route '/open-play/create'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\OpenPlayController::create
 * @see app/Http/Controllers/OpenPlayController.php:41
 * @route '/open-play/create'
 */
    const createForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: create.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\OpenPlayController::create
 * @see app/Http/Controllers/OpenPlayController.php:41
 * @route '/open-play/create'
 */
        createForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\OpenPlayController::create
 * @see app/Http/Controllers/OpenPlayController.php:41
 * @route '/open-play/create'
 */
        createForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    create.form = createForm
/**
* @see \App\Http\Controllers\OpenPlayController::store
 * @see app/Http/Controllers/OpenPlayController.php:52
 * @route '/open-play'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/open-play',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\OpenPlayController::store
 * @see app/Http/Controllers/OpenPlayController.php:52
 * @route '/open-play'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\OpenPlayController::store
 * @see app/Http/Controllers/OpenPlayController.php:52
 * @route '/open-play'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\OpenPlayController::store
 * @see app/Http/Controllers/OpenPlayController.php:52
 * @route '/open-play'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\OpenPlayController::store
 * @see app/Http/Controllers/OpenPlayController.php:52
 * @route '/open-play'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\OpenPlayController::edit
 * @see app/Http/Controllers/OpenPlayController.php:61
 * @route '/open-play/{open_play}/edit'
 */
export const edit = (args: { open_play: number | { id: number } } | [open_play: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})

edit.definition = {
    methods: ["get","head"],
    url: '/open-play/{open_play}/edit',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\OpenPlayController::edit
 * @see app/Http/Controllers/OpenPlayController.php:61
 * @route '/open-play/{open_play}/edit'
 */
edit.url = (args: { open_play: number | { id: number } } | [open_play: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return edit.definition.url
            .replace('{open_play}', parsedArgs.open_play.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\OpenPlayController::edit
 * @see app/Http/Controllers/OpenPlayController.php:61
 * @route '/open-play/{open_play}/edit'
 */
edit.get = (args: { open_play: number | { id: number } } | [open_play: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\OpenPlayController::edit
 * @see app/Http/Controllers/OpenPlayController.php:61
 * @route '/open-play/{open_play}/edit'
 */
edit.head = (args: { open_play: number | { id: number } } | [open_play: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: edit.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\OpenPlayController::edit
 * @see app/Http/Controllers/OpenPlayController.php:61
 * @route '/open-play/{open_play}/edit'
 */
    const editForm = (args: { open_play: number | { id: number } } | [open_play: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: edit.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\OpenPlayController::edit
 * @see app/Http/Controllers/OpenPlayController.php:61
 * @route '/open-play/{open_play}/edit'
 */
        editForm.get = (args: { open_play: number | { id: number } } | [open_play: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: edit.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\OpenPlayController::edit
 * @see app/Http/Controllers/OpenPlayController.php:61
 * @route '/open-play/{open_play}/edit'
 */
        editForm.head = (args: { open_play: number | { id: number } } | [open_play: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: edit.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    edit.form = editForm
/**
* @see \App\Http\Controllers\OpenPlayController::update
 * @see app/Http/Controllers/OpenPlayController.php:70
 * @route '/open-play/{open_play}'
 */
export const update = (args: { open_play: number | { id: number } } | [open_play: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put","patch"],
    url: '/open-play/{open_play}',
} satisfies RouteDefinition<["put","patch"]>

/**
* @see \App\Http\Controllers\OpenPlayController::update
 * @see app/Http/Controllers/OpenPlayController.php:70
 * @route '/open-play/{open_play}'
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
* @see \App\Http\Controllers\OpenPlayController::update
 * @see app/Http/Controllers/OpenPlayController.php:70
 * @route '/open-play/{open_play}'
 */
update.put = (args: { open_play: number | { id: number } } | [open_play: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})
/**
* @see \App\Http\Controllers\OpenPlayController::update
 * @see app/Http/Controllers/OpenPlayController.php:70
 * @route '/open-play/{open_play}'
 */
update.patch = (args: { open_play: number | { id: number } } | [open_play: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\OpenPlayController::update
 * @see app/Http/Controllers/OpenPlayController.php:70
 * @route '/open-play/{open_play}'
 */
    const updateForm = (args: { open_play: number | { id: number } } | [open_play: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\OpenPlayController::update
 * @see app/Http/Controllers/OpenPlayController.php:70
 * @route '/open-play/{open_play}'
 */
        updateForm.put = (args: { open_play: number | { id: number } } | [open_play: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\OpenPlayController::update
 * @see app/Http/Controllers/OpenPlayController.php:70
 * @route '/open-play/{open_play}'
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
/**
* @see \App\Http\Controllers\OpenPlayController::destroy
 * @see app/Http/Controllers/OpenPlayController.php:79
 * @route '/open-play/{open_play}'
 */
export const destroy = (args: { open_play: number | { id: number } } | [open_play: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/open-play/{open_play}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\OpenPlayController::destroy
 * @see app/Http/Controllers/OpenPlayController.php:79
 * @route '/open-play/{open_play}'
 */
destroy.url = (args: { open_play: number | { id: number } } | [open_play: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return destroy.definition.url
            .replace('{open_play}', parsedArgs.open_play.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\OpenPlayController::destroy
 * @see app/Http/Controllers/OpenPlayController.php:79
 * @route '/open-play/{open_play}'
 */
destroy.delete = (args: { open_play: number | { id: number } } | [open_play: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\OpenPlayController::destroy
 * @see app/Http/Controllers/OpenPlayController.php:79
 * @route '/open-play/{open_play}'
 */
    const destroyForm = (args: { open_play: number | { id: number } } | [open_play: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\OpenPlayController::destroy
 * @see app/Http/Controllers/OpenPlayController.php:79
 * @route '/open-play/{open_play}'
 */
        destroyForm.delete = (args: { open_play: number | { id: number } } | [open_play: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\OpenPlayController::manage
 * @see app/Http/Controllers/OpenPlayController.php:90
 * @route '/open-play/{open_play}/manage'
 */
export const manage = (args: { open_play: number | { id: number } } | [open_play: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: manage.url(args, options),
    method: 'get',
})

manage.definition = {
    methods: ["get","head"],
    url: '/open-play/{open_play}/manage',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\OpenPlayController::manage
 * @see app/Http/Controllers/OpenPlayController.php:90
 * @route '/open-play/{open_play}/manage'
 */
manage.url = (args: { open_play: number | { id: number } } | [open_play: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return manage.definition.url
            .replace('{open_play}', parsedArgs.open_play.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\OpenPlayController::manage
 * @see app/Http/Controllers/OpenPlayController.php:90
 * @route '/open-play/{open_play}/manage'
 */
manage.get = (args: { open_play: number | { id: number } } | [open_play: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: manage.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\OpenPlayController::manage
 * @see app/Http/Controllers/OpenPlayController.php:90
 * @route '/open-play/{open_play}/manage'
 */
manage.head = (args: { open_play: number | { id: number } } | [open_play: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: manage.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\OpenPlayController::manage
 * @see app/Http/Controllers/OpenPlayController.php:90
 * @route '/open-play/{open_play}/manage'
 */
    const manageForm = (args: { open_play: number | { id: number } } | [open_play: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: manage.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\OpenPlayController::manage
 * @see app/Http/Controllers/OpenPlayController.php:90
 * @route '/open-play/{open_play}/manage'
 */
        manageForm.get = (args: { open_play: number | { id: number } } | [open_play: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: manage.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\OpenPlayController::manage
 * @see app/Http/Controllers/OpenPlayController.php:90
 * @route '/open-play/{open_play}/manage'
 */
        manageForm.head = (args: { open_play: number | { id: number } } | [open_play: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: manage.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    manage.form = manageForm
const openPlay = {
    browse: Object.assign(browse, browse),
mine: Object.assign(mine, mine),
join: Object.assign(join, join0c68bd),
players: Object.assign(players, players),
index: Object.assign(index, index),
create: Object.assign(create, create),
store: Object.assign(store, store),
edit: Object.assign(edit, edit),
update: Object.assign(update, update),
destroy: Object.assign(destroy, destroy),
manage: Object.assign(manage, manage),
registrations: Object.assign(registrations, registrations),
bracket: Object.assign(bracket, bracket),
targetScore: Object.assign(targetScore, targetScore),
matches: Object.assign(matches, matches),
bracketMatches: Object.assign(bracketMatches, bracketMatches),
}

export default openPlay