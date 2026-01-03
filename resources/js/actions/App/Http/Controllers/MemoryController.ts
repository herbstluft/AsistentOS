import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\MemoryController::index
* @see app/Http/Controllers/MemoryController.php:15
* @route '/api/memories'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/api/memories',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\MemoryController::index
* @see app/Http/Controllers/MemoryController.php:15
* @route '/api/memories'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\MemoryController::index
* @see app/Http/Controllers/MemoryController.php:15
* @route '/api/memories'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\MemoryController::index
* @see app/Http/Controllers/MemoryController.php:15
* @route '/api/memories'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\MemoryController::index
* @see app/Http/Controllers/MemoryController.php:15
* @route '/api/memories'
*/
const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\MemoryController::index
* @see app/Http/Controllers/MemoryController.php:15
* @route '/api/memories'
*/
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\MemoryController::index
* @see app/Http/Controllers/MemoryController.php:15
* @route '/api/memories'
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
* @see \App\Http\Controllers\MemoryController::store
* @see app/Http/Controllers/MemoryController.php:72
* @route '/api/memories'
*/
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/api/memories',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\MemoryController::store
* @see app/Http/Controllers/MemoryController.php:72
* @route '/api/memories'
*/
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\MemoryController::store
* @see app/Http/Controllers/MemoryController.php:72
* @route '/api/memories'
*/
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\MemoryController::store
* @see app/Http/Controllers/MemoryController.php:72
* @route '/api/memories'
*/
const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\MemoryController::store
* @see app/Http/Controllers/MemoryController.php:72
* @route '/api/memories'
*/
storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

store.form = storeForm

/**
* @see \App\Http\Controllers\MemoryController::search
* @see app/Http/Controllers/MemoryController.php:47
* @route '/api/memories/search'
*/
export const search = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: search.url(options),
    method: 'get',
})

search.definition = {
    methods: ["get","head"],
    url: '/api/memories/search',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\MemoryController::search
* @see app/Http/Controllers/MemoryController.php:47
* @route '/api/memories/search'
*/
search.url = (options?: RouteQueryOptions) => {
    return search.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\MemoryController::search
* @see app/Http/Controllers/MemoryController.php:47
* @route '/api/memories/search'
*/
search.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: search.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\MemoryController::search
* @see app/Http/Controllers/MemoryController.php:47
* @route '/api/memories/search'
*/
search.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: search.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\MemoryController::search
* @see app/Http/Controllers/MemoryController.php:47
* @route '/api/memories/search'
*/
const searchForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: search.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\MemoryController::search
* @see app/Http/Controllers/MemoryController.php:47
* @route '/api/memories/search'
*/
searchForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: search.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\MemoryController::search
* @see app/Http/Controllers/MemoryController.php:47
* @route '/api/memories/search'
*/
searchForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: search.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

search.form = searchForm

const MemoryController = { index, store, search }

export default MemoryController