import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\AiQueryController::execute
* @see app/Http/Controllers/AiQueryController.php:13
* @route '/api/execute-ai-query'
*/
export const execute = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: execute.url(options),
    method: 'post',
})

execute.definition = {
    methods: ["post"],
    url: '/api/execute-ai-query',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\AiQueryController::execute
* @see app/Http/Controllers/AiQueryController.php:13
* @route '/api/execute-ai-query'
*/
execute.url = (options?: RouteQueryOptions) => {
    return execute.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\AiQueryController::execute
* @see app/Http/Controllers/AiQueryController.php:13
* @route '/api/execute-ai-query'
*/
execute.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: execute.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\AiQueryController::execute
* @see app/Http/Controllers/AiQueryController.php:13
* @route '/api/execute-ai-query'
*/
const executeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: execute.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\AiQueryController::execute
* @see app/Http/Controllers/AiQueryController.php:13
* @route '/api/execute-ai-query'
*/
executeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: execute.url(options),
    method: 'post',
})

execute.form = executeForm

const AiQueryController = { execute }

export default AiQueryController