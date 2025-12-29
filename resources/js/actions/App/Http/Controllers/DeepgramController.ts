import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\DeepgramController::token
* @see app/Http/Controllers/DeepgramController.php:13
* @route '/api/deepgram/token'
*/
export const token = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: token.url(options),
    method: 'get',
})

token.definition = {
    methods: ["get","head"],
    url: '/api/deepgram/token',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\DeepgramController::token
* @see app/Http/Controllers/DeepgramController.php:13
* @route '/api/deepgram/token'
*/
token.url = (options?: RouteQueryOptions) => {
    return token.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\DeepgramController::token
* @see app/Http/Controllers/DeepgramController.php:13
* @route '/api/deepgram/token'
*/
token.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: token.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\DeepgramController::token
* @see app/Http/Controllers/DeepgramController.php:13
* @route '/api/deepgram/token'
*/
token.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: token.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\DeepgramController::token
* @see app/Http/Controllers/DeepgramController.php:13
* @route '/api/deepgram/token'
*/
const tokenForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: token.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\DeepgramController::token
* @see app/Http/Controllers/DeepgramController.php:13
* @route '/api/deepgram/token'
*/
tokenForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: token.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\DeepgramController::token
* @see app/Http/Controllers/DeepgramController.php:13
* @route '/api/deepgram/token'
*/
tokenForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: token.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

token.form = tokenForm

const DeepgramController = { token }

export default DeepgramController