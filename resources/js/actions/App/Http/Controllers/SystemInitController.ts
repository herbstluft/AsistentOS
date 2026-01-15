import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\SystemInitController::bootstrap
* @see app/Http/Controllers/SystemInitController.php:15
* @route '/api/app-init'
*/
export const bootstrap = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: bootstrap.url(options),
    method: 'get',
})

bootstrap.definition = {
    methods: ["get","head"],
    url: '/api/app-init',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SystemInitController::bootstrap
* @see app/Http/Controllers/SystemInitController.php:15
* @route '/api/app-init'
*/
bootstrap.url = (options?: RouteQueryOptions) => {
    return bootstrap.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SystemInitController::bootstrap
* @see app/Http/Controllers/SystemInitController.php:15
* @route '/api/app-init'
*/
bootstrap.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: bootstrap.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SystemInitController::bootstrap
* @see app/Http/Controllers/SystemInitController.php:15
* @route '/api/app-init'
*/
bootstrap.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: bootstrap.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\SystemInitController::bootstrap
* @see app/Http/Controllers/SystemInitController.php:15
* @route '/api/app-init'
*/
const bootstrapForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: bootstrap.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SystemInitController::bootstrap
* @see app/Http/Controllers/SystemInitController.php:15
* @route '/api/app-init'
*/
bootstrapForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: bootstrap.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SystemInitController::bootstrap
* @see app/Http/Controllers/SystemInitController.php:15
* @route '/api/app-init'
*/
bootstrapForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: bootstrap.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

bootstrap.form = bootstrapForm

const SystemInitController = { bootstrap }

export default SystemInitController