import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../wayfinder'
/**
* @see \App\Http\Controllers\PlayerController::index
 * @see app/Http/Controllers/PlayerController.php:20
 * @route '/players'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/players',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PlayerController::index
 * @see app/Http/Controllers/PlayerController.php:20
 * @route '/players'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\PlayerController::index
 * @see app/Http/Controllers/PlayerController.php:20
 * @route '/players'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PlayerController::index
 * @see app/Http/Controllers/PlayerController.php:20
 * @route '/players'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PlayerController::index
 * @see app/Http/Controllers/PlayerController.php:20
 * @route '/players'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PlayerController::index
 * @see app/Http/Controllers/PlayerController.php:20
 * @route '/players'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PlayerController::index
 * @see app/Http/Controllers/PlayerController.php:20
 * @route '/players'
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
* @see \App\Http\Controllers\PlayerController::create
 * @see app/Http/Controllers/PlayerController.php:30
 * @route '/players/create'
 */
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/players/create',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PlayerController::create
 * @see app/Http/Controllers/PlayerController.php:30
 * @route '/players/create'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\PlayerController::create
 * @see app/Http/Controllers/PlayerController.php:30
 * @route '/players/create'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PlayerController::create
 * @see app/Http/Controllers/PlayerController.php:30
 * @route '/players/create'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PlayerController::create
 * @see app/Http/Controllers/PlayerController.php:30
 * @route '/players/create'
 */
    const createForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: create.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PlayerController::create
 * @see app/Http/Controllers/PlayerController.php:30
 * @route '/players/create'
 */
        createForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PlayerController::create
 * @see app/Http/Controllers/PlayerController.php:30
 * @route '/players/create'
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
* @see \App\Http\Controllers\PlayerController::store
 * @see app/Http/Controllers/PlayerController.php:37
 * @route '/players'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/players',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\PlayerController::store
 * @see app/Http/Controllers/PlayerController.php:37
 * @route '/players'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\PlayerController::store
 * @see app/Http/Controllers/PlayerController.php:37
 * @route '/players'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\PlayerController::store
 * @see app/Http/Controllers/PlayerController.php:37
 * @route '/players'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\PlayerController::store
 * @see app/Http/Controllers/PlayerController.php:37
 * @route '/players'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\PlayerController::show
 * @see app/Http/Controllers/PlayerController.php:46
 * @route '/players/{player}'
 */
export const show = (args: { player: number | { id: number } } | [player: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/players/{player}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PlayerController::show
 * @see app/Http/Controllers/PlayerController.php:46
 * @route '/players/{player}'
 */
show.url = (args: { player: number | { id: number } } | [player: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { player: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { player: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    player: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        player: typeof args.player === 'object'
                ? args.player.id
                : args.player,
                }

    return show.definition.url
            .replace('{player}', parsedArgs.player.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PlayerController::show
 * @see app/Http/Controllers/PlayerController.php:46
 * @route '/players/{player}'
 */
show.get = (args: { player: number | { id: number } } | [player: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PlayerController::show
 * @see app/Http/Controllers/PlayerController.php:46
 * @route '/players/{player}'
 */
show.head = (args: { player: number | { id: number } } | [player: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PlayerController::show
 * @see app/Http/Controllers/PlayerController.php:46
 * @route '/players/{player}'
 */
    const showForm = (args: { player: number | { id: number } } | [player: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PlayerController::show
 * @see app/Http/Controllers/PlayerController.php:46
 * @route '/players/{player}'
 */
        showForm.get = (args: { player: number | { id: number } } | [player: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PlayerController::show
 * @see app/Http/Controllers/PlayerController.php:46
 * @route '/players/{player}'
 */
        showForm.head = (args: { player: number | { id: number } } | [player: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    show.form = showForm
/**
* @see \App\Http\Controllers\PlayerController::edit
 * @see app/Http/Controllers/PlayerController.php:57
 * @route '/players/{player}/edit'
 */
export const edit = (args: { player: number | { id: number } } | [player: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})

edit.definition = {
    methods: ["get","head"],
    url: '/players/{player}/edit',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PlayerController::edit
 * @see app/Http/Controllers/PlayerController.php:57
 * @route '/players/{player}/edit'
 */
edit.url = (args: { player: number | { id: number } } | [player: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { player: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { player: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    player: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        player: typeof args.player === 'object'
                ? args.player.id
                : args.player,
                }

    return edit.definition.url
            .replace('{player}', parsedArgs.player.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PlayerController::edit
 * @see app/Http/Controllers/PlayerController.php:57
 * @route '/players/{player}/edit'
 */
edit.get = (args: { player: number | { id: number } } | [player: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PlayerController::edit
 * @see app/Http/Controllers/PlayerController.php:57
 * @route '/players/{player}/edit'
 */
edit.head = (args: { player: number | { id: number } } | [player: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: edit.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PlayerController::edit
 * @see app/Http/Controllers/PlayerController.php:57
 * @route '/players/{player}/edit'
 */
    const editForm = (args: { player: number | { id: number } } | [player: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: edit.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PlayerController::edit
 * @see app/Http/Controllers/PlayerController.php:57
 * @route '/players/{player}/edit'
 */
        editForm.get = (args: { player: number | { id: number } } | [player: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: edit.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PlayerController::edit
 * @see app/Http/Controllers/PlayerController.php:57
 * @route '/players/{player}/edit'
 */
        editForm.head = (args: { player: number | { id: number } } | [player: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\PlayerController::update
 * @see app/Http/Controllers/PlayerController.php:68
 * @route '/players/{player}'
 */
export const update = (args: { player: number | { id: number } } | [player: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put","patch"],
    url: '/players/{player}',
} satisfies RouteDefinition<["put","patch"]>

/**
* @see \App\Http\Controllers\PlayerController::update
 * @see app/Http/Controllers/PlayerController.php:68
 * @route '/players/{player}'
 */
update.url = (args: { player: number | { id: number } } | [player: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { player: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { player: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    player: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        player: typeof args.player === 'object'
                ? args.player.id
                : args.player,
                }

    return update.definition.url
            .replace('{player}', parsedArgs.player.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PlayerController::update
 * @see app/Http/Controllers/PlayerController.php:68
 * @route '/players/{player}'
 */
update.put = (args: { player: number | { id: number } } | [player: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})
/**
* @see \App\Http\Controllers\PlayerController::update
 * @see app/Http/Controllers/PlayerController.php:68
 * @route '/players/{player}'
 */
update.patch = (args: { player: number | { id: number } } | [player: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\PlayerController::update
 * @see app/Http/Controllers/PlayerController.php:68
 * @route '/players/{player}'
 */
    const updateForm = (args: { player: number | { id: number } } | [player: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\PlayerController::update
 * @see app/Http/Controllers/PlayerController.php:68
 * @route '/players/{player}'
 */
        updateForm.put = (args: { player: number | { id: number } } | [player: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\PlayerController::update
 * @see app/Http/Controllers/PlayerController.php:68
 * @route '/players/{player}'
 */
        updateForm.patch = (args: { player: number | { id: number } } | [player: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\PlayerController::destroy
 * @see app/Http/Controllers/PlayerController.php:77
 * @route '/players/{player}'
 */
export const destroy = (args: { player: number | { id: number } } | [player: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/players/{player}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\PlayerController::destroy
 * @see app/Http/Controllers/PlayerController.php:77
 * @route '/players/{player}'
 */
destroy.url = (args: { player: number | { id: number } } | [player: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { player: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { player: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    player: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        player: typeof args.player === 'object'
                ? args.player.id
                : args.player,
                }

    return destroy.definition.url
            .replace('{player}', parsedArgs.player.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PlayerController::destroy
 * @see app/Http/Controllers/PlayerController.php:77
 * @route '/players/{player}'
 */
destroy.delete = (args: { player: number | { id: number } } | [player: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\PlayerController::destroy
 * @see app/Http/Controllers/PlayerController.php:77
 * @route '/players/{player}'
 */
    const destroyForm = (args: { player: number | { id: number } } | [player: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\PlayerController::destroy
 * @see app/Http/Controllers/PlayerController.php:77
 * @route '/players/{player}'
 */
        destroyForm.delete = (args: { player: number | { id: number } } | [player: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
const players = {
    index: Object.assign(index, index),
create: Object.assign(create, create),
store: Object.assign(store, store),
show: Object.assign(show, show),
edit: Object.assign(edit, edit),
update: Object.assign(update, update),
destroy: Object.assign(destroy, destroy),
}

export default players