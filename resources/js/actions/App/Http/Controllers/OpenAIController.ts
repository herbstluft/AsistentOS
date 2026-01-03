import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\OpenAIController::proxy
* @see app/Http/Controllers/OpenAIController.php:10
* @route '/api/openai/proxy'
*/
export const proxy = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: proxy.url(options),
    method: 'post',
})

proxy.definition = {
    methods: ["post"],
    url: '/api/openai/proxy',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\OpenAIController::proxy
* @see app/Http/Controllers/OpenAIController.php:10
* @route '/api/openai/proxy'
*/
proxy.url = (options?: RouteQueryOptions) => {
    return proxy.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\OpenAIController::proxy
* @see app/Http/Controllers/OpenAIController.php:10
* @route '/api/openai/proxy'
*/
proxy.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: proxy.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\OpenAIController::proxy
* @see app/Http/Controllers/OpenAIController.php:10
* @route '/api/openai/proxy'
*/
const proxyForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: proxy.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\OpenAIController::proxy
* @see app/Http/Controllers/OpenAIController.php:10
* @route '/api/openai/proxy'
*/
proxyForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: proxy.url(options),
    method: 'post',
})

proxy.form = proxyForm

const OpenAIController = { proxy }

export default OpenAIController