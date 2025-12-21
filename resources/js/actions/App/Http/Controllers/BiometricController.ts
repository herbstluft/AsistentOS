import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\BiometricController::index
* @see app/Http/Controllers/BiometricController.php:120
* @route '/api/biometrics'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/api/biometrics',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\BiometricController::index
* @see app/Http/Controllers/BiometricController.php:120
* @route '/api/biometrics'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\BiometricController::index
* @see app/Http/Controllers/BiometricController.php:120
* @route '/api/biometrics'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\BiometricController::index
* @see app/Http/Controllers/BiometricController.php:120
* @route '/api/biometrics'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\BiometricController::index
* @see app/Http/Controllers/BiometricController.php:120
* @route '/api/biometrics'
*/
const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\BiometricController::index
* @see app/Http/Controllers/BiometricController.php:120
* @route '/api/biometrics'
*/
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\BiometricController::index
* @see app/Http/Controllers/BiometricController.php:120
* @route '/api/biometrics'
*/
indexForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

index.form = indexForm

/**
* @see \App\Http\Controllers\BiometricController::update
* @see app/Http/Controllers/BiometricController.php:127
* @route '/api/biometrics/{id}'
*/
export const update = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/api/biometrics/{id}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\BiometricController::update
* @see app/Http/Controllers/BiometricController.php:127
* @route '/api/biometrics/{id}'
*/
update.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { id: args }
    }

    if (Array.isArray(args)) {
        args = {
            id: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        id: args.id,
    }

    return update.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\BiometricController::update
* @see app/Http/Controllers/BiometricController.php:127
* @route '/api/biometrics/{id}'
*/
update.put = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\BiometricController::update
* @see app/Http/Controllers/BiometricController.php:127
* @route '/api/biometrics/{id}'
*/
const updateForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\BiometricController::update
* @see app/Http/Controllers/BiometricController.php:127
* @route '/api/biometrics/{id}'
*/
updateForm.put = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

update.form = updateForm

/**
* @see \App\Http\Controllers\BiometricController::destroy
* @see app/Http/Controllers/BiometricController.php:140
* @route '/api/biometrics/{id}'
*/
export const destroy = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/api/biometrics/{id}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\BiometricController::destroy
* @see app/Http/Controllers/BiometricController.php:140
* @route '/api/biometrics/{id}'
*/
destroy.url = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { id: args }
    }

    if (Array.isArray(args)) {
        args = {
            id: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        id: args.id,
    }

    return destroy.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\BiometricController::destroy
* @see app/Http/Controllers/BiometricController.php:140
* @route '/api/biometrics/{id}'
*/
destroy.delete = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\BiometricController::destroy
* @see app/Http/Controllers/BiometricController.php:140
* @route '/api/biometrics/{id}'
*/
const destroyForm = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\BiometricController::destroy
* @see app/Http/Controllers/BiometricController.php:140
* @route '/api/biometrics/{id}'
*/
destroyForm.delete = (args: { id: string | number } | [id: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

destroy.form = destroyForm

/**
* @see \App\Http\Controllers\BiometricController::registerOptions
* @see app/Http/Controllers/BiometricController.php:13
* @route '/api/biometrics/register/options'
*/
export const registerOptions = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: registerOptions.url(options),
    method: 'get',
})

registerOptions.definition = {
    methods: ["get","head"],
    url: '/api/biometrics/register/options',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\BiometricController::registerOptions
* @see app/Http/Controllers/BiometricController.php:13
* @route '/api/biometrics/register/options'
*/
registerOptions.url = (options?: RouteQueryOptions) => {
    return registerOptions.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\BiometricController::registerOptions
* @see app/Http/Controllers/BiometricController.php:13
* @route '/api/biometrics/register/options'
*/
registerOptions.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: registerOptions.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\BiometricController::registerOptions
* @see app/Http/Controllers/BiometricController.php:13
* @route '/api/biometrics/register/options'
*/
registerOptions.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: registerOptions.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\BiometricController::registerOptions
* @see app/Http/Controllers/BiometricController.php:13
* @route '/api/biometrics/register/options'
*/
const registerOptionsForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: registerOptions.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\BiometricController::registerOptions
* @see app/Http/Controllers/BiometricController.php:13
* @route '/api/biometrics/register/options'
*/
registerOptionsForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: registerOptions.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\BiometricController::registerOptions
* @see app/Http/Controllers/BiometricController.php:13
* @route '/api/biometrics/register/options'
*/
registerOptionsForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: registerOptions.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

registerOptions.form = registerOptionsForm

/**
* @see \App\Http\Controllers\BiometricController::register
* @see app/Http/Controllers/BiometricController.php:46
* @route '/api/biometrics/register'
*/
export const register = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: register.url(options),
    method: 'post',
})

register.definition = {
    methods: ["post"],
    url: '/api/biometrics/register',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\BiometricController::register
* @see app/Http/Controllers/BiometricController.php:46
* @route '/api/biometrics/register'
*/
register.url = (options?: RouteQueryOptions) => {
    return register.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\BiometricController::register
* @see app/Http/Controllers/BiometricController.php:46
* @route '/api/biometrics/register'
*/
register.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: register.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\BiometricController::register
* @see app/Http/Controllers/BiometricController.php:46
* @route '/api/biometrics/register'
*/
const registerForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: register.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\BiometricController::register
* @see app/Http/Controllers/BiometricController.php:46
* @route '/api/biometrics/register'
*/
registerForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: register.url(options),
    method: 'post',
})

register.form = registerForm

/**
* @see \App\Http\Controllers\BiometricController::authenticateOptions
* @see app/Http/Controllers/BiometricController.php:70
* @route '/api/biometrics/login/options'
*/
export const authenticateOptions = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: authenticateOptions.url(options),
    method: 'get',
})

authenticateOptions.definition = {
    methods: ["get","head"],
    url: '/api/biometrics/login/options',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\BiometricController::authenticateOptions
* @see app/Http/Controllers/BiometricController.php:70
* @route '/api/biometrics/login/options'
*/
authenticateOptions.url = (options?: RouteQueryOptions) => {
    return authenticateOptions.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\BiometricController::authenticateOptions
* @see app/Http/Controllers/BiometricController.php:70
* @route '/api/biometrics/login/options'
*/
authenticateOptions.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: authenticateOptions.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\BiometricController::authenticateOptions
* @see app/Http/Controllers/BiometricController.php:70
* @route '/api/biometrics/login/options'
*/
authenticateOptions.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: authenticateOptions.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\BiometricController::authenticateOptions
* @see app/Http/Controllers/BiometricController.php:70
* @route '/api/biometrics/login/options'
*/
const authenticateOptionsForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: authenticateOptions.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\BiometricController::authenticateOptions
* @see app/Http/Controllers/BiometricController.php:70
* @route '/api/biometrics/login/options'
*/
authenticateOptionsForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: authenticateOptions.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\BiometricController::authenticateOptions
* @see app/Http/Controllers/BiometricController.php:70
* @route '/api/biometrics/login/options'
*/
authenticateOptionsForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: authenticateOptions.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

authenticateOptions.form = authenticateOptionsForm

/**
* @see \App\Http\Controllers\BiometricController::authenticate
* @see app/Http/Controllers/BiometricController.php:94
* @route '/api/biometrics/login'
*/
export const authenticate = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: authenticate.url(options),
    method: 'post',
})

authenticate.definition = {
    methods: ["post"],
    url: '/api/biometrics/login',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\BiometricController::authenticate
* @see app/Http/Controllers/BiometricController.php:94
* @route '/api/biometrics/login'
*/
authenticate.url = (options?: RouteQueryOptions) => {
    return authenticate.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\BiometricController::authenticate
* @see app/Http/Controllers/BiometricController.php:94
* @route '/api/biometrics/login'
*/
authenticate.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: authenticate.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\BiometricController::authenticate
* @see app/Http/Controllers/BiometricController.php:94
* @route '/api/biometrics/login'
*/
const authenticateForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: authenticate.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\BiometricController::authenticate
* @see app/Http/Controllers/BiometricController.php:94
* @route '/api/biometrics/login'
*/
authenticateForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: authenticate.url(options),
    method: 'post',
})

authenticate.form = authenticateForm

const BiometricController = { index, update, destroy, registerOptions, register, authenticateOptions, authenticate }

export default BiometricController