import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../wayfinder'
/**
* @see \App\Http\Controllers\AnnouncementController::index
 * @see app/Http/Controllers/AnnouncementController.php:26
 * @route '/announcements'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/announcements',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\AnnouncementController::index
 * @see app/Http/Controllers/AnnouncementController.php:26
 * @route '/announcements'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\AnnouncementController::index
 * @see app/Http/Controllers/AnnouncementController.php:26
 * @route '/announcements'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\AnnouncementController::index
 * @see app/Http/Controllers/AnnouncementController.php:26
 * @route '/announcements'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

<<<<<<< HEAD
    /**
* @see \App\Http\Controllers\AnnouncementController::index
 * @see app/Http/Controllers/AnnouncementController.php:26
 * @route '/announcements'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\AnnouncementController::index
 * @see app/Http/Controllers/AnnouncementController.php:26
 * @route '/announcements'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\AnnouncementController::index
 * @see app/Http/Controllers/AnnouncementController.php:26
 * @route '/announcements'
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
=======
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
/**
* @see \App\Http\Controllers\AnnouncementController::create
 * @see app/Http/Controllers/AnnouncementController.php:35
 * @route '/announcements/create'
 */
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/announcements/create',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\AnnouncementController::create
 * @see app/Http/Controllers/AnnouncementController.php:35
 * @route '/announcements/create'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\AnnouncementController::create
 * @see app/Http/Controllers/AnnouncementController.php:35
 * @route '/announcements/create'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\AnnouncementController::create
 * @see app/Http/Controllers/AnnouncementController.php:35
 * @route '/announcements/create'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

<<<<<<< HEAD
    /**
* @see \App\Http\Controllers\AnnouncementController::create
 * @see app/Http/Controllers/AnnouncementController.php:35
 * @route '/announcements/create'
 */
    const createForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: create.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\AnnouncementController::create
 * @see app/Http/Controllers/AnnouncementController.php:35
 * @route '/announcements/create'
 */
        createForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\AnnouncementController::create
 * @see app/Http/Controllers/AnnouncementController.php:35
 * @route '/announcements/create'
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
=======
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
/**
* @see \App\Http\Controllers\AnnouncementController::store
 * @see app/Http/Controllers/AnnouncementController.php:44
 * @route '/announcements'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/announcements',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\AnnouncementController::store
 * @see app/Http/Controllers/AnnouncementController.php:44
 * @route '/announcements'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\AnnouncementController::store
 * @see app/Http/Controllers/AnnouncementController.php:44
 * @route '/announcements'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

<<<<<<< HEAD
    /**
* @see \App\Http\Controllers\AnnouncementController::store
 * @see app/Http/Controllers/AnnouncementController.php:44
 * @route '/announcements'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\AnnouncementController::store
 * @see app/Http/Controllers/AnnouncementController.php:44
 * @route '/announcements'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
=======
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
/**
* @see \App\Http\Controllers\AnnouncementController::edit
 * @see app/Http/Controllers/AnnouncementController.php:62
 * @route '/announcements/{announcement}/edit'
 */
export const edit = (args: { announcement: number | { id: number } } | [announcement: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})

edit.definition = {
    methods: ["get","head"],
    url: '/announcements/{announcement}/edit',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\AnnouncementController::edit
 * @see app/Http/Controllers/AnnouncementController.php:62
 * @route '/announcements/{announcement}/edit'
 */
edit.url = (args: { announcement: number | { id: number } } | [announcement: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { announcement: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { announcement: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    announcement: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        announcement: typeof args.announcement === 'object'
                ? args.announcement.id
                : args.announcement,
                }

    return edit.definition.url
            .replace('{announcement}', parsedArgs.announcement.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\AnnouncementController::edit
 * @see app/Http/Controllers/AnnouncementController.php:62
 * @route '/announcements/{announcement}/edit'
 */
edit.get = (args: { announcement: number | { id: number } } | [announcement: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\AnnouncementController::edit
 * @see app/Http/Controllers/AnnouncementController.php:62
 * @route '/announcements/{announcement}/edit'
 */
edit.head = (args: { announcement: number | { id: number } } | [announcement: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: edit.url(args, options),
    method: 'head',
})

<<<<<<< HEAD
    /**
* @see \App\Http\Controllers\AnnouncementController::edit
 * @see app/Http/Controllers/AnnouncementController.php:62
 * @route '/announcements/{announcement}/edit'
 */
    const editForm = (args: { announcement: number | { id: number } } | [announcement: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: edit.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\AnnouncementController::edit
 * @see app/Http/Controllers/AnnouncementController.php:62
 * @route '/announcements/{announcement}/edit'
 */
        editForm.get = (args: { announcement: number | { id: number } } | [announcement: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: edit.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\AnnouncementController::edit
 * @see app/Http/Controllers/AnnouncementController.php:62
 * @route '/announcements/{announcement}/edit'
 */
        editForm.head = (args: { announcement: number | { id: number } } | [announcement: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: edit.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    edit.form = editForm
=======
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
/**
* @see \App\Http\Controllers\AnnouncementController::update
 * @see app/Http/Controllers/AnnouncementController.php:72
 * @route '/announcements/{announcement}'
 */
export const update = (args: { announcement: number | { id: number } } | [announcement: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put","patch"],
    url: '/announcements/{announcement}',
} satisfies RouteDefinition<["put","patch"]>

/**
* @see \App\Http\Controllers\AnnouncementController::update
 * @see app/Http/Controllers/AnnouncementController.php:72
 * @route '/announcements/{announcement}'
 */
update.url = (args: { announcement: number | { id: number } } | [announcement: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { announcement: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { announcement: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    announcement: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        announcement: typeof args.announcement === 'object'
                ? args.announcement.id
                : args.announcement,
                }

    return update.definition.url
            .replace('{announcement}', parsedArgs.announcement.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\AnnouncementController::update
 * @see app/Http/Controllers/AnnouncementController.php:72
 * @route '/announcements/{announcement}'
 */
update.put = (args: { announcement: number | { id: number } } | [announcement: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})
/**
* @see \App\Http\Controllers\AnnouncementController::update
 * @see app/Http/Controllers/AnnouncementController.php:72
 * @route '/announcements/{announcement}'
 */
update.patch = (args: { announcement: number | { id: number } } | [announcement: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

<<<<<<< HEAD
    /**
* @see \App\Http\Controllers\AnnouncementController::update
 * @see app/Http/Controllers/AnnouncementController.php:72
 * @route '/announcements/{announcement}'
 */
    const updateForm = (args: { announcement: number | { id: number } } | [announcement: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\AnnouncementController::update
 * @see app/Http/Controllers/AnnouncementController.php:72
 * @route '/announcements/{announcement}'
 */
        updateForm.put = (args: { announcement: number | { id: number } } | [announcement: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\AnnouncementController::update
 * @see app/Http/Controllers/AnnouncementController.php:72
 * @route '/announcements/{announcement}'
 */
        updateForm.patch = (args: { announcement: number | { id: number } } | [announcement: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PATCH',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    update.form = updateForm
=======
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
/**
* @see \App\Http\Controllers\AnnouncementController::destroy
 * @see app/Http/Controllers/AnnouncementController.php:89
 * @route '/announcements/{announcement}'
 */
export const destroy = (args: { announcement: number | { id: number } } | [announcement: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/announcements/{announcement}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\AnnouncementController::destroy
 * @see app/Http/Controllers/AnnouncementController.php:89
 * @route '/announcements/{announcement}'
 */
destroy.url = (args: { announcement: number | { id: number } } | [announcement: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { announcement: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { announcement: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    announcement: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        announcement: typeof args.announcement === 'object'
                ? args.announcement.id
                : args.announcement,
                }

    return destroy.definition.url
            .replace('{announcement}', parsedArgs.announcement.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\AnnouncementController::destroy
 * @see app/Http/Controllers/AnnouncementController.php:89
 * @route '/announcements/{announcement}'
 */
destroy.delete = (args: { announcement: number | { id: number } } | [announcement: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})
<<<<<<< HEAD

    /**
* @see \App\Http\Controllers\AnnouncementController::destroy
 * @see app/Http/Controllers/AnnouncementController.php:89
 * @route '/announcements/{announcement}'
 */
    const destroyForm = (args: { announcement: number | { id: number } } | [announcement: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\AnnouncementController::destroy
 * @see app/Http/Controllers/AnnouncementController.php:89
 * @route '/announcements/{announcement}'
 */
        destroyForm.delete = (args: { announcement: number | { id: number } } | [announcement: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
=======
>>>>>>> 607da1784b926d2e8bad5158935321557db75b66
const announcements = {
    index: Object.assign(index, index),
create: Object.assign(create, create),
store: Object.assign(store, store),
edit: Object.assign(edit, edit),
update: Object.assign(update, update),
destroy: Object.assign(destroy, destroy),
}

export default announcements