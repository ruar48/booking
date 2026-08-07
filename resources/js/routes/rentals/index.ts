import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
import transactions from './transactions'
/**
* @see \App\Http\Controllers\RentalMemberController::browse
 * @see app/Http/Controllers/RentalMemberController.php:23
 * @route '/rentals/browse'
 */
export const browse = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: browse.url(options),
    method: 'get',
})

browse.definition = {
    methods: ["get","head"],
    url: '/rentals/browse',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\RentalMemberController::browse
 * @see app/Http/Controllers/RentalMemberController.php:23
 * @route '/rentals/browse'
 */
browse.url = (options?: RouteQueryOptions) => {
    return browse.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\RentalMemberController::browse
 * @see app/Http/Controllers/RentalMemberController.php:23
 * @route '/rentals/browse'
 */
browse.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: browse.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\RentalMemberController::browse
 * @see app/Http/Controllers/RentalMemberController.php:23
 * @route '/rentals/browse'
 */
browse.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: browse.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\RentalMemberController::browse
 * @see app/Http/Controllers/RentalMemberController.php:23
 * @route '/rentals/browse'
 */
    const browseForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: browse.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\RentalMemberController::browse
 * @see app/Http/Controllers/RentalMemberController.php:23
 * @route '/rentals/browse'
 */
        browseForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: browse.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\RentalMemberController::browse
 * @see app/Http/Controllers/RentalMemberController.php:23
 * @route '/rentals/browse'
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
* @see \App\Http\Controllers\RentalMemberController::mine
 * @see app/Http/Controllers/RentalMemberController.php:35
 * @route '/rentals/mine'
 */
export const mine = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: mine.url(options),
    method: 'get',
})

mine.definition = {
    methods: ["get","head"],
    url: '/rentals/mine',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\RentalMemberController::mine
 * @see app/Http/Controllers/RentalMemberController.php:35
 * @route '/rentals/mine'
 */
mine.url = (options?: RouteQueryOptions) => {
    return mine.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\RentalMemberController::mine
 * @see app/Http/Controllers/RentalMemberController.php:35
 * @route '/rentals/mine'
 */
mine.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: mine.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\RentalMemberController::mine
 * @see app/Http/Controllers/RentalMemberController.php:35
 * @route '/rentals/mine'
 */
mine.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: mine.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\RentalMemberController::mine
 * @see app/Http/Controllers/RentalMemberController.php:35
 * @route '/rentals/mine'
 */
    const mineForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: mine.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\RentalMemberController::mine
 * @see app/Http/Controllers/RentalMemberController.php:35
 * @route '/rentals/mine'
 */
        mineForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: mine.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\RentalMemberController::mine
 * @see app/Http/Controllers/RentalMemberController.php:35
 * @route '/rentals/mine'
 */
        mineForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: mine.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    mine.form = mineForm
/**
* @see \App\Http\Controllers\RentalMemberController::rent
 * @see app/Http/Controllers/RentalMemberController.php:48
 * @route '/rentals/rent'
 */
export const rent = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: rent.url(options),
    method: 'post',
})

rent.definition = {
    methods: ["post"],
    url: '/rentals/rent',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\RentalMemberController::rent
 * @see app/Http/Controllers/RentalMemberController.php:48
 * @route '/rentals/rent'
 */
rent.url = (options?: RouteQueryOptions) => {
    return rent.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\RentalMemberController::rent
 * @see app/Http/Controllers/RentalMemberController.php:48
 * @route '/rentals/rent'
 */
rent.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: rent.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\RentalMemberController::rent
 * @see app/Http/Controllers/RentalMemberController.php:48
 * @route '/rentals/rent'
 */
    const rentForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: rent.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\RentalMemberController::rent
 * @see app/Http/Controllers/RentalMemberController.php:48
 * @route '/rentals/rent'
 */
        rentForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: rent.url(options),
            method: 'post',
        })
    
    rent.form = rentForm
/**
* @see \App\Http\Controllers\RentalController::checkout
 * @see app/Http/Controllers/RentalController.php:22
 * @route '/rentals'
 */
export const checkout = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: checkout.url(options),
    method: 'get',
})

checkout.definition = {
    methods: ["get","head"],
    url: '/rentals',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\RentalController::checkout
 * @see app/Http/Controllers/RentalController.php:22
 * @route '/rentals'
 */
checkout.url = (options?: RouteQueryOptions) => {
    return checkout.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\RentalController::checkout
 * @see app/Http/Controllers/RentalController.php:22
 * @route '/rentals'
 */
checkout.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: checkout.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\RentalController::checkout
 * @see app/Http/Controllers/RentalController.php:22
 * @route '/rentals'
 */
checkout.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: checkout.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\RentalController::checkout
 * @see app/Http/Controllers/RentalController.php:22
 * @route '/rentals'
 */
    const checkoutForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: checkout.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\RentalController::checkout
 * @see app/Http/Controllers/RentalController.php:22
 * @route '/rentals'
 */
        checkoutForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: checkout.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\RentalController::checkout
 * @see app/Http/Controllers/RentalController.php:22
 * @route '/rentals'
 */
        checkoutForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: checkout.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    checkout.form = checkoutForm
/**
* @see \App\Http\Controllers\RentalController::store
 * @see app/Http/Controllers/RentalController.php:36
 * @route '/rentals'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/rentals',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\RentalController::store
 * @see app/Http/Controllers/RentalController.php:36
 * @route '/rentals'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\RentalController::store
 * @see app/Http/Controllers/RentalController.php:36
 * @route '/rentals'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\RentalController::store
 * @see app/Http/Controllers/RentalController.php:36
 * @route '/rentals'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\RentalController::store
 * @see app/Http/Controllers/RentalController.php:36
 * @route '/rentals'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
const rentals = {
    browse: Object.assign(browse, browse),
mine: Object.assign(mine, mine),
rent: Object.assign(rent, rent),
checkout: Object.assign(checkout, checkout),
store: Object.assign(store, store),
transactions: Object.assign(transactions, transactions),
}

export default rentals