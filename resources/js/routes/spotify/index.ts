import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
/**
* @see \App\Http\Controllers\SpotifyController::redirect
* @see app/Http/Controllers/SpotifyController.php:14
* @route '/auth/spotify'
*/
export const redirect = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: redirect.url(options),
    method: 'get',
})

redirect.definition = {
    methods: ["get","head"],
    url: '/auth/spotify',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SpotifyController::redirect
* @see app/Http/Controllers/SpotifyController.php:14
* @route '/auth/spotify'
*/
redirect.url = (options?: RouteQueryOptions) => {
    return redirect.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SpotifyController::redirect
* @see app/Http/Controllers/SpotifyController.php:14
* @route '/auth/spotify'
*/
redirect.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: redirect.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SpotifyController::redirect
* @see app/Http/Controllers/SpotifyController.php:14
* @route '/auth/spotify'
*/
redirect.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: redirect.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\SpotifyController::redirect
* @see app/Http/Controllers/SpotifyController.php:14
* @route '/auth/spotify'
*/
const redirectForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: redirect.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SpotifyController::redirect
* @see app/Http/Controllers/SpotifyController.php:14
* @route '/auth/spotify'
*/
redirectForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: redirect.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SpotifyController::redirect
* @see app/Http/Controllers/SpotifyController.php:14
* @route '/auth/spotify'
*/
redirectForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: redirect.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

redirect.form = redirectForm

/**
* @see \App\Http\Controllers\SpotifyController::callback
* @see app/Http/Controllers/SpotifyController.php:31
* @route '/auth/spotify/callback'
*/
export const callback = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: callback.url(options),
    method: 'get',
})

callback.definition = {
    methods: ["get","head"],
    url: '/auth/spotify/callback',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SpotifyController::callback
* @see app/Http/Controllers/SpotifyController.php:31
* @route '/auth/spotify/callback'
*/
callback.url = (options?: RouteQueryOptions) => {
    return callback.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SpotifyController::callback
* @see app/Http/Controllers/SpotifyController.php:31
* @route '/auth/spotify/callback'
*/
callback.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: callback.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SpotifyController::callback
* @see app/Http/Controllers/SpotifyController.php:31
* @route '/auth/spotify/callback'
*/
callback.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: callback.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\SpotifyController::callback
* @see app/Http/Controllers/SpotifyController.php:31
* @route '/auth/spotify/callback'
*/
const callbackForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: callback.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SpotifyController::callback
* @see app/Http/Controllers/SpotifyController.php:31
* @route '/auth/spotify/callback'
*/
callbackForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: callback.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SpotifyController::callback
* @see app/Http/Controllers/SpotifyController.php:31
* @route '/auth/spotify/callback'
*/
callbackForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: callback.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

callback.form = callbackForm

const spotify = {
    redirect: Object.assign(redirect, redirect),
    callback: Object.assign(callback, callback),
}

export default spotify