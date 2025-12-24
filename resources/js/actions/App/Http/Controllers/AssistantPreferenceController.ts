import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\AssistantPreferenceController::getPreference
* @see app/Http/Controllers/AssistantPreferenceController.php:12
* @route '/api/assistant/preference'
*/
export const getPreference = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getPreference.url(options),
    method: 'get',
})

getPreference.definition = {
    methods: ["get","head"],
    url: '/api/assistant/preference',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\AssistantPreferenceController::getPreference
* @see app/Http/Controllers/AssistantPreferenceController.php:12
* @route '/api/assistant/preference'
*/
getPreference.url = (options?: RouteQueryOptions) => {
    return getPreference.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\AssistantPreferenceController::getPreference
* @see app/Http/Controllers/AssistantPreferenceController.php:12
* @route '/api/assistant/preference'
*/
getPreference.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getPreference.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\AssistantPreferenceController::getPreference
* @see app/Http/Controllers/AssistantPreferenceController.php:12
* @route '/api/assistant/preference'
*/
getPreference.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getPreference.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\AssistantPreferenceController::getPreference
* @see app/Http/Controllers/AssistantPreferenceController.php:12
* @route '/api/assistant/preference'
*/
const getPreferenceForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getPreference.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\AssistantPreferenceController::getPreference
* @see app/Http/Controllers/AssistantPreferenceController.php:12
* @route '/api/assistant/preference'
*/
getPreferenceForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getPreference.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\AssistantPreferenceController::getPreference
* @see app/Http/Controllers/AssistantPreferenceController.php:12
* @route '/api/assistant/preference'
*/
getPreferenceForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getPreference.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

getPreference.form = getPreferenceForm

/**
* @see \App\Http\Controllers\AssistantPreferenceController::savePreference
* @see app/Http/Controllers/AssistantPreferenceController.php:25
* @route '/api/assistant/preference'
*/
export const savePreference = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: savePreference.url(options),
    method: 'post',
})

savePreference.definition = {
    methods: ["post"],
    url: '/api/assistant/preference',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\AssistantPreferenceController::savePreference
* @see app/Http/Controllers/AssistantPreferenceController.php:25
* @route '/api/assistant/preference'
*/
savePreference.url = (options?: RouteQueryOptions) => {
    return savePreference.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\AssistantPreferenceController::savePreference
* @see app/Http/Controllers/AssistantPreferenceController.php:25
* @route '/api/assistant/preference'
*/
savePreference.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: savePreference.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\AssistantPreferenceController::savePreference
* @see app/Http/Controllers/AssistantPreferenceController.php:25
* @route '/api/assistant/preference'
*/
const savePreferenceForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: savePreference.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\AssistantPreferenceController::savePreference
* @see app/Http/Controllers/AssistantPreferenceController.php:25
* @route '/api/assistant/preference'
*/
savePreferenceForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: savePreference.url(options),
    method: 'post',
})

savePreference.form = savePreferenceForm

const AssistantPreferenceController = { getPreference, savePreference }

export default AssistantPreferenceController