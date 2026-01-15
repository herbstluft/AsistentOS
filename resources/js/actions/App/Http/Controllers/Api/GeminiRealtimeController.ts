import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\GeminiRealtimeController::status
* @see app/Http/Controllers/Api/GeminiRealtimeController.php:19
* @route '/api/gemini/realtime/status'
*/
export const status = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: status.url(options),
    method: 'get',
})

status.definition = {
    methods: ["get","head"],
    url: '/api/gemini/realtime/status',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\GeminiRealtimeController::status
* @see app/Http/Controllers/Api/GeminiRealtimeController.php:19
* @route '/api/gemini/realtime/status'
*/
status.url = (options?: RouteQueryOptions) => {
    return status.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\GeminiRealtimeController::status
* @see app/Http/Controllers/Api/GeminiRealtimeController.php:19
* @route '/api/gemini/realtime/status'
*/
status.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: status.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\GeminiRealtimeController::status
* @see app/Http/Controllers/Api/GeminiRealtimeController.php:19
* @route '/api/gemini/realtime/status'
*/
status.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: status.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\GeminiRealtimeController::status
* @see app/Http/Controllers/Api/GeminiRealtimeController.php:19
* @route '/api/gemini/realtime/status'
*/
const statusForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: status.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\GeminiRealtimeController::status
* @see app/Http/Controllers/Api/GeminiRealtimeController.php:19
* @route '/api/gemini/realtime/status'
*/
statusForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: status.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\GeminiRealtimeController::status
* @see app/Http/Controllers/Api/GeminiRealtimeController.php:19
* @route '/api/gemini/realtime/status'
*/
statusForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: status.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

status.form = statusForm

/**
* @see \App\Http\Controllers\Api\GeminiRealtimeController::token
* @see app/Http/Controllers/Api/GeminiRealtimeController.php:55
* @route '/api/gemini/token'
*/
export const token = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: token.url(options),
    method: 'get',
})

token.definition = {
    methods: ["get","head"],
    url: '/api/gemini/token',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\GeminiRealtimeController::token
* @see app/Http/Controllers/Api/GeminiRealtimeController.php:55
* @route '/api/gemini/token'
*/
token.url = (options?: RouteQueryOptions) => {
    return token.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\GeminiRealtimeController::token
* @see app/Http/Controllers/Api/GeminiRealtimeController.php:55
* @route '/api/gemini/token'
*/
token.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: token.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\GeminiRealtimeController::token
* @see app/Http/Controllers/Api/GeminiRealtimeController.php:55
* @route '/api/gemini/token'
*/
token.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: token.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\GeminiRealtimeController::token
* @see app/Http/Controllers/Api/GeminiRealtimeController.php:55
* @route '/api/gemini/token'
*/
const tokenForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: token.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\GeminiRealtimeController::token
* @see app/Http/Controllers/Api/GeminiRealtimeController.php:55
* @route '/api/gemini/token'
*/
tokenForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: token.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\GeminiRealtimeController::token
* @see app/Http/Controllers/Api/GeminiRealtimeController.php:55
* @route '/api/gemini/token'
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

/**
* @see \App\Http\Controllers\Api\GeminiRealtimeController::logEvent
* @see app/Http/Controllers/Api/GeminiRealtimeController.php:74
* @route '/api/gemini/realtime/log'
*/
export const logEvent = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: logEvent.url(options),
    method: 'post',
})

logEvent.definition = {
    methods: ["post"],
    url: '/api/gemini/realtime/log',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\GeminiRealtimeController::logEvent
* @see app/Http/Controllers/Api/GeminiRealtimeController.php:74
* @route '/api/gemini/realtime/log'
*/
logEvent.url = (options?: RouteQueryOptions) => {
    return logEvent.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\GeminiRealtimeController::logEvent
* @see app/Http/Controllers/Api/GeminiRealtimeController.php:74
* @route '/api/gemini/realtime/log'
*/
logEvent.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: logEvent.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\GeminiRealtimeController::logEvent
* @see app/Http/Controllers/Api/GeminiRealtimeController.php:74
* @route '/api/gemini/realtime/log'
*/
const logEventForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: logEvent.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\GeminiRealtimeController::logEvent
* @see app/Http/Controllers/Api/GeminiRealtimeController.php:74
* @route '/api/gemini/realtime/log'
*/
logEventForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: logEvent.url(options),
    method: 'post',
})

logEvent.form = logEventForm

/**
* @see \App\Http\Controllers\Api\GeminiRealtimeController::stats
* @see app/Http/Controllers/Api/GeminiRealtimeController.php:99
* @route '/api/gemini/realtime/stats'
*/
export const stats = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: stats.url(options),
    method: 'get',
})

stats.definition = {
    methods: ["get","head"],
    url: '/api/gemini/realtime/stats',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\GeminiRealtimeController::stats
* @see app/Http/Controllers/Api/GeminiRealtimeController.php:99
* @route '/api/gemini/realtime/stats'
*/
stats.url = (options?: RouteQueryOptions) => {
    return stats.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\GeminiRealtimeController::stats
* @see app/Http/Controllers/Api/GeminiRealtimeController.php:99
* @route '/api/gemini/realtime/stats'
*/
stats.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: stats.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\GeminiRealtimeController::stats
* @see app/Http/Controllers/Api/GeminiRealtimeController.php:99
* @route '/api/gemini/realtime/stats'
*/
stats.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: stats.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\GeminiRealtimeController::stats
* @see app/Http/Controllers/Api/GeminiRealtimeController.php:99
* @route '/api/gemini/realtime/stats'
*/
const statsForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: stats.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\GeminiRealtimeController::stats
* @see app/Http/Controllers/Api/GeminiRealtimeController.php:99
* @route '/api/gemini/realtime/stats'
*/
statsForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: stats.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\GeminiRealtimeController::stats
* @see app/Http/Controllers/Api/GeminiRealtimeController.php:99
* @route '/api/gemini/realtime/stats'
*/
statsForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: stats.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

stats.form = statsForm

const GeminiRealtimeController = { status, token, logEvent, stats }

export default GeminiRealtimeController