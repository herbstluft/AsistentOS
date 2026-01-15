import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
/**
* @see routes/web.php:47
* @route '/test-realtime'
*/
export const realtime = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: realtime.url(options),
    method: 'get',
})

realtime.definition = {
    methods: ["get","head"],
    url: '/test-realtime',
} satisfies RouteDefinition<["get","head"]>

/**
* @see routes/web.php:47
* @route '/test-realtime'
*/
realtime.url = (options?: RouteQueryOptions) => {
    return realtime.definition.url + queryParams(options)
}

/**
* @see routes/web.php:47
* @route '/test-realtime'
*/
realtime.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: realtime.url(options),
    method: 'get',
})

/**
* @see routes/web.php:47
* @route '/test-realtime'
*/
realtime.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: realtime.url(options),
    method: 'head',
})

/**
* @see routes/web.php:47
* @route '/test-realtime'
*/
const realtimeForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: realtime.url(options),
    method: 'get',
})

/**
* @see routes/web.php:47
* @route '/test-realtime'
*/
realtimeForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: realtime.url(options),
    method: 'get',
})

/**
* @see routes/web.php:47
* @route '/test-realtime'
*/
realtimeForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: realtime.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

realtime.form = realtimeForm

const test = {
    realtime: Object.assign(realtime, realtime),
}

export default test