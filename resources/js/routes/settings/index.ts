import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
/**
* @see routes/web.php:52
* @route '/settings/biometrics'
*/
export const biometrics = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: biometrics.url(options),
    method: 'get',
})

biometrics.definition = {
    methods: ["get","head"],
    url: '/settings/biometrics',
} satisfies RouteDefinition<["get","head"]>

/**
* @see routes/web.php:52
* @route '/settings/biometrics'
*/
biometrics.url = (options?: RouteQueryOptions) => {
    return biometrics.definition.url + queryParams(options)
}

/**
* @see routes/web.php:52
* @route '/settings/biometrics'
*/
biometrics.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: biometrics.url(options),
    method: 'get',
})

/**
* @see routes/web.php:52
* @route '/settings/biometrics'
*/
biometrics.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: biometrics.url(options),
    method: 'head',
})

/**
* @see routes/web.php:52
* @route '/settings/biometrics'
*/
const biometricsForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: biometrics.url(options),
    method: 'get',
})

/**
* @see routes/web.php:52
* @route '/settings/biometrics'
*/
biometricsForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: biometrics.url(options),
    method: 'get',
})

/**
* @see routes/web.php:52
* @route '/settings/biometrics'
*/
biometricsForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: biometrics.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

biometrics.form = biometricsForm

/**
* @see routes/web.php:56
* @route '/settings/spotify'
*/
export const spotify = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: spotify.url(options),
    method: 'get',
})

spotify.definition = {
    methods: ["get","head"],
    url: '/settings/spotify',
} satisfies RouteDefinition<["get","head"]>

/**
* @see routes/web.php:56
* @route '/settings/spotify'
*/
spotify.url = (options?: RouteQueryOptions) => {
    return spotify.definition.url + queryParams(options)
}

/**
* @see routes/web.php:56
* @route '/settings/spotify'
*/
spotify.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: spotify.url(options),
    method: 'get',
})

/**
* @see routes/web.php:56
* @route '/settings/spotify'
*/
spotify.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: spotify.url(options),
    method: 'head',
})

/**
* @see routes/web.php:56
* @route '/settings/spotify'
*/
const spotifyForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: spotify.url(options),
    method: 'get',
})

/**
* @see routes/web.php:56
* @route '/settings/spotify'
*/
spotifyForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: spotify.url(options),
    method: 'get',
})

/**
* @see routes/web.php:56
* @route '/settings/spotify'
*/
spotifyForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: spotify.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

spotify.form = spotifyForm

const settings = {
    biometrics: Object.assign(biometrics, biometrics),
    spotify: Object.assign(spotify, spotify),
}

export default settings