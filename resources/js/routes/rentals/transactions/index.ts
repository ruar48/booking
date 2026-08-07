import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\RentalTransactionController::index
 * @see app/Http/Controllers/RentalTransactionController.php:23
 * @route '/rentals/transactions'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/rentals/transactions',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\RentalTransactionController::index
 * @see app/Http/Controllers/RentalTransactionController.php:23
 * @route '/rentals/transactions'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\RentalTransactionController::index
 * @see app/Http/Controllers/RentalTransactionController.php:23
 * @route '/rentals/transactions'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\RentalTransactionController::index
 * @see app/Http/Controllers/RentalTransactionController.php:23
 * @route '/rentals/transactions'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\RentalTransactionController::show
 * @see app/Http/Controllers/RentalTransactionController.php:60
 * @route '/rentals/transactions/{rental_transaction}'
 */
export const show = (args: { rental_transaction: number | { id: number } } | [rental_transaction: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/rentals/transactions/{rental_transaction}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\RentalTransactionController::show
 * @see app/Http/Controllers/RentalTransactionController.php:60
 * @route '/rentals/transactions/{rental_transaction}'
 */
show.url = (args: { rental_transaction: number | { id: number } } | [rental_transaction: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { rental_transaction: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { rental_transaction: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    rental_transaction: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        rental_transaction: typeof args.rental_transaction === 'object'
                ? args.rental_transaction.id
                : args.rental_transaction,
                }

    return show.definition.url
            .replace('{rental_transaction}', parsedArgs.rental_transaction.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\RentalTransactionController::show
 * @see app/Http/Controllers/RentalTransactionController.php:60
 * @route '/rentals/transactions/{rental_transaction}'
 */
show.get = (args: { rental_transaction: number | { id: number } } | [rental_transaction: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\RentalTransactionController::show
 * @see app/Http/Controllers/RentalTransactionController.php:60
 * @route '/rentals/transactions/{rental_transaction}'
 */
show.head = (args: { rental_transaction: number | { id: number } } | [rental_transaction: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\RentalTransactionController::returnItems
 * @see app/Http/Controllers/RentalTransactionController.php:71
 * @route '/rentals/transactions/{rental_transaction}/return'
 */
export const returnItems = (args: { rental_transaction: number | { id: number } } | [rental_transaction: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: returnItems.url(args, options),
    method: 'patch',
})

returnItems.definition = {
    methods: ["patch"],
    url: '/rentals/transactions/{rental_transaction}/return',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\RentalTransactionController::returnItems
 * @see app/Http/Controllers/RentalTransactionController.php:71
 * @route '/rentals/transactions/{rental_transaction}/return'
 */
returnItems.url = (args: { rental_transaction: number | { id: number } } | [rental_transaction: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { rental_transaction: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { rental_transaction: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    rental_transaction: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        rental_transaction: typeof args.rental_transaction === 'object'
                ? args.rental_transaction.id
                : args.rental_transaction,
                }

    return returnItems.definition.url
            .replace('{rental_transaction}', parsedArgs.rental_transaction.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\RentalTransactionController::returnItems
 * @see app/Http/Controllers/RentalTransactionController.php:71
 * @route '/rentals/transactions/{rental_transaction}/return'
 */
returnItems.patch = (args: { rental_transaction: number | { id: number } } | [rental_transaction: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: returnItems.url(args, options),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\RentalTransactionController::approve
 * @see app/Http/Controllers/RentalTransactionController.php:88
 * @route '/rentals/transactions/{rental_transaction}/approve'
 */
export const approve = (args: { rental_transaction: number | { id: number } } | [rental_transaction: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: approve.url(args, options),
    method: 'post',
})

approve.definition = {
    methods: ["post"],
    url: '/rentals/transactions/{rental_transaction}/approve',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\RentalTransactionController::approve
 * @see app/Http/Controllers/RentalTransactionController.php:88
 * @route '/rentals/transactions/{rental_transaction}/approve'
 */
approve.url = (args: { rental_transaction: number | { id: number } } | [rental_transaction: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { rental_transaction: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { rental_transaction: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    rental_transaction: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        rental_transaction: typeof args.rental_transaction === 'object'
                ? args.rental_transaction.id
                : args.rental_transaction,
                }

    return approve.definition.url
            .replace('{rental_transaction}', parsedArgs.rental_transaction.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\RentalTransactionController::approve
 * @see app/Http/Controllers/RentalTransactionController.php:88
 * @route '/rentals/transactions/{rental_transaction}/approve'
 */
approve.post = (args: { rental_transaction: number | { id: number } } | [rental_transaction: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: approve.url(args, options),
    method: 'post',
})
const transactions = {
    index: Object.assign(index, index),
show: Object.assign(show, show),
returnItems: Object.assign(returnItems, returnItems),
approve: Object.assign(approve, approve),
}

export default transactions