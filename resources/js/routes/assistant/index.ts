import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
/**
* @see \App\Http\Controllers\Settings\AssistantController::edit
* @see app/Http/Controllers/Settings/AssistantController.php:16
* @route '/settings/assistant'
*/
export const edit = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(options),
    method: 'get',
})

edit.definition = {
    methods: ["get","head"],
    url: '/settings/assistant',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Settings\AssistantController::edit
* @see app/Http/Controllers/Settings/AssistantController.php:16
* @route '/settings/assistant'
*/
edit.url = (options?: RouteQueryOptions) => {
    return edit.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\AssistantController::edit
* @see app/Http/Controllers/Settings/AssistantController.php:16
* @route '/settings/assistant'
*/
edit.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Settings\AssistantController::edit
* @see app/Http/Controllers/Settings/AssistantController.php:16
* @route '/settings/assistant'
*/
edit.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: edit.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Settings\AssistantController::edit
* @see app/Http/Controllers/Settings/AssistantController.php:16
* @route '/settings/assistant'
*/
const editForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: edit.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Settings\AssistantController::edit
* @see app/Http/Controllers/Settings/AssistantController.php:16
* @route '/settings/assistant'
*/
editForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: edit.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Settings\AssistantController::edit
* @see app/Http/Controllers/Settings/AssistantController.php:16
* @route '/settings/assistant'
*/
editForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: edit.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

edit.form = editForm

/**
* @see \App\Http\Controllers\Settings\AssistantController::update
* @see app/Http/Controllers/Settings/AssistantController.php:26
* @route '/settings/assistant'
*/
export const update = (options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(options),
    method: 'patch',
})

update.definition = {
    methods: ["patch"],
    url: '/settings/assistant',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\Settings\AssistantController::update
* @see app/Http/Controllers/Settings/AssistantController.php:26
* @route '/settings/assistant'
*/
update.url = (options?: RouteQueryOptions) => {
    return update.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\AssistantController::update
* @see app/Http/Controllers/Settings/AssistantController.php:26
* @route '/settings/assistant'
*/
update.patch = (options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(options),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\Settings\AssistantController::update
* @see app/Http/Controllers/Settings/AssistantController.php:26
* @route '/settings/assistant'
*/
const updateForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Settings\AssistantController::update
* @see app/Http/Controllers/Settings/AssistantController.php:26
* @route '/settings/assistant'
*/
updateForm.patch = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

update.form = updateForm

const assistant = {
    edit: Object.assign(edit, edit),
    update: Object.assign(update, update),
}

export default assistant