import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\GeminiController::proxy
* @see app/Http/Controllers/GeminiController.php:10
* @route '/api/gemini/proxy'
*/
export const proxy = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: proxy.url(options),
    method: 'post',
})

proxy.definition = {
    methods: ["post"],
    url: '/api/gemini/proxy',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\GeminiController::proxy
* @see app/Http/Controllers/GeminiController.php:10
* @route '/api/gemini/proxy'
*/
proxy.url = (options?: RouteQueryOptions) => {
    return proxy.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\GeminiController::proxy
* @see app/Http/Controllers/GeminiController.php:10
* @route '/api/gemini/proxy'
*/
proxy.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: proxy.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\GeminiController::proxy
* @see app/Http/Controllers/GeminiController.php:10
* @route '/api/gemini/proxy'
*/
const proxyForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: proxy.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\GeminiController::proxy
* @see app/Http/Controllers/GeminiController.php:10
* @route '/api/gemini/proxy'
*/
proxyForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: proxy.url(options),
    method: 'post',
})

proxy.form = proxyForm

const GeminiController = { proxy }

export default GeminiController