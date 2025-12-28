import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\SubscriptionController::validatePayment
* @see app/Http/Controllers/SubscriptionController.php:51
* @route '/api/subscription/validate-payment'
*/
export const validatePayment = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: validatePayment.url(options),
    method: 'post',
})

validatePayment.definition = {
    methods: ["post"],
    url: '/api/subscription/validate-payment',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\SubscriptionController::validatePayment
* @see app/Http/Controllers/SubscriptionController.php:51
* @route '/api/subscription/validate-payment'
*/
validatePayment.url = (options?: RouteQueryOptions) => {
    return validatePayment.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SubscriptionController::validatePayment
* @see app/Http/Controllers/SubscriptionController.php:51
* @route '/api/subscription/validate-payment'
*/
validatePayment.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: validatePayment.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SubscriptionController::validatePayment
* @see app/Http/Controllers/SubscriptionController.php:51
* @route '/api/subscription/validate-payment'
*/
const validatePaymentForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: validatePayment.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SubscriptionController::validatePayment
* @see app/Http/Controllers/SubscriptionController.php:51
* @route '/api/subscription/validate-payment'
*/
validatePaymentForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: validatePayment.url(options),
    method: 'post',
})

validatePayment.form = validatePaymentForm

/**
* @see \App\Http\Controllers\SubscriptionController::status
* @see app/Http/Controllers/SubscriptionController.php:418
* @route '/api/subscription/status'
*/
export const status = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: status.url(options),
    method: 'get',
})

status.definition = {
    methods: ["get","head"],
    url: '/api/subscription/status',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SubscriptionController::status
* @see app/Http/Controllers/SubscriptionController.php:418
* @route '/api/subscription/status'
*/
status.url = (options?: RouteQueryOptions) => {
    return status.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SubscriptionController::status
* @see app/Http/Controllers/SubscriptionController.php:418
* @route '/api/subscription/status'
*/
status.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: status.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SubscriptionController::status
* @see app/Http/Controllers/SubscriptionController.php:418
* @route '/api/subscription/status'
*/
status.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: status.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\SubscriptionController::status
* @see app/Http/Controllers/SubscriptionController.php:418
* @route '/api/subscription/status'
*/
const statusForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: status.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SubscriptionController::status
* @see app/Http/Controllers/SubscriptionController.php:418
* @route '/api/subscription/status'
*/
statusForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: status.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SubscriptionController::status
* @see app/Http/Controllers/SubscriptionController.php:418
* @route '/api/subscription/status'
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
* @see \App\Http\Controllers\SubscriptionController::setupIntent
* @see app/Http/Controllers/SubscriptionController.php:20
* @route '/api/subscription/setup-intent'
*/
export const setupIntent = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: setupIntent.url(options),
    method: 'post',
})

setupIntent.definition = {
    methods: ["post"],
    url: '/api/subscription/setup-intent',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\SubscriptionController::setupIntent
* @see app/Http/Controllers/SubscriptionController.php:20
* @route '/api/subscription/setup-intent'
*/
setupIntent.url = (options?: RouteQueryOptions) => {
    return setupIntent.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SubscriptionController::setupIntent
* @see app/Http/Controllers/SubscriptionController.php:20
* @route '/api/subscription/setup-intent'
*/
setupIntent.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: setupIntent.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SubscriptionController::setupIntent
* @see app/Http/Controllers/SubscriptionController.php:20
* @route '/api/subscription/setup-intent'
*/
const setupIntentForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: setupIntent.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SubscriptionController::setupIntent
* @see app/Http/Controllers/SubscriptionController.php:20
* @route '/api/subscription/setup-intent'
*/
setupIntentForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: setupIntent.url(options),
    method: 'post',
})

setupIntent.form = setupIntentForm

/**
* @see \App\Http\Controllers\SubscriptionController::startTrial
* @see app/Http/Controllers/SubscriptionController.php:127
* @route '/api/subscription/start-trial'
*/
export const startTrial = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: startTrial.url(options),
    method: 'post',
})

startTrial.definition = {
    methods: ["post"],
    url: '/api/subscription/start-trial',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\SubscriptionController::startTrial
* @see app/Http/Controllers/SubscriptionController.php:127
* @route '/api/subscription/start-trial'
*/
startTrial.url = (options?: RouteQueryOptions) => {
    return startTrial.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SubscriptionController::startTrial
* @see app/Http/Controllers/SubscriptionController.php:127
* @route '/api/subscription/start-trial'
*/
startTrial.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: startTrial.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SubscriptionController::startTrial
* @see app/Http/Controllers/SubscriptionController.php:127
* @route '/api/subscription/start-trial'
*/
const startTrialForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: startTrial.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SubscriptionController::startTrial
* @see app/Http/Controllers/SubscriptionController.php:127
* @route '/api/subscription/start-trial'
*/
startTrialForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: startTrial.url(options),
    method: 'post',
})

startTrial.form = startTrialForm

/**
* @see \App\Http\Controllers\SubscriptionController::cancelTrial
* @see app/Http/Controllers/SubscriptionController.php:213
* @route '/api/subscription/cancel-trial'
*/
export const cancelTrial = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cancelTrial.url(options),
    method: 'post',
})

cancelTrial.definition = {
    methods: ["post"],
    url: '/api/subscription/cancel-trial',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\SubscriptionController::cancelTrial
* @see app/Http/Controllers/SubscriptionController.php:213
* @route '/api/subscription/cancel-trial'
*/
cancelTrial.url = (options?: RouteQueryOptions) => {
    return cancelTrial.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SubscriptionController::cancelTrial
* @see app/Http/Controllers/SubscriptionController.php:213
* @route '/api/subscription/cancel-trial'
*/
cancelTrial.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cancelTrial.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SubscriptionController::cancelTrial
* @see app/Http/Controllers/SubscriptionController.php:213
* @route '/api/subscription/cancel-trial'
*/
const cancelTrialForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: cancelTrial.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SubscriptionController::cancelTrial
* @see app/Http/Controllers/SubscriptionController.php:213
* @route '/api/subscription/cancel-trial'
*/
cancelTrialForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: cancelTrial.url(options),
    method: 'post',
})

cancelTrial.form = cancelTrialForm

/**
* @see \App\Http\Controllers\SubscriptionController::convertToSubscription
* @see app/Http/Controllers/SubscriptionController.php:238
* @route '/api/subscription/convert'
*/
export const convertToSubscription = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: convertToSubscription.url(options),
    method: 'post',
})

convertToSubscription.definition = {
    methods: ["post"],
    url: '/api/subscription/convert',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\SubscriptionController::convertToSubscription
* @see app/Http/Controllers/SubscriptionController.php:238
* @route '/api/subscription/convert'
*/
convertToSubscription.url = (options?: RouteQueryOptions) => {
    return convertToSubscription.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SubscriptionController::convertToSubscription
* @see app/Http/Controllers/SubscriptionController.php:238
* @route '/api/subscription/convert'
*/
convertToSubscription.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: convertToSubscription.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SubscriptionController::convertToSubscription
* @see app/Http/Controllers/SubscriptionController.php:238
* @route '/api/subscription/convert'
*/
const convertToSubscriptionForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: convertToSubscription.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SubscriptionController::convertToSubscription
* @see app/Http/Controllers/SubscriptionController.php:238
* @route '/api/subscription/convert'
*/
convertToSubscriptionForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: convertToSubscription.url(options),
    method: 'post',
})

convertToSubscription.form = convertToSubscriptionForm

/**
* @see \App\Http\Controllers\SubscriptionController::reactivate
* @see app/Http/Controllers/SubscriptionController.php:319
* @route '/api/subscription/reactivate'
*/
export const reactivate = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: reactivate.url(options),
    method: 'post',
})

reactivate.definition = {
    methods: ["post"],
    url: '/api/subscription/reactivate',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\SubscriptionController::reactivate
* @see app/Http/Controllers/SubscriptionController.php:319
* @route '/api/subscription/reactivate'
*/
reactivate.url = (options?: RouteQueryOptions) => {
    return reactivate.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SubscriptionController::reactivate
* @see app/Http/Controllers/SubscriptionController.php:319
* @route '/api/subscription/reactivate'
*/
reactivate.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: reactivate.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SubscriptionController::reactivate
* @see app/Http/Controllers/SubscriptionController.php:319
* @route '/api/subscription/reactivate'
*/
const reactivateForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: reactivate.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SubscriptionController::reactivate
* @see app/Http/Controllers/SubscriptionController.php:319
* @route '/api/subscription/reactivate'
*/
reactivateForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: reactivate.url(options),
    method: 'post',
})

reactivate.form = reactivateForm

/**
* @see \App\Http\Controllers\SubscriptionController::cancel
* @see app/Http/Controllers/SubscriptionController.php:283
* @route '/api/subscription/cancel'
*/
export const cancel = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cancel.url(options),
    method: 'post',
})

cancel.definition = {
    methods: ["post"],
    url: '/api/subscription/cancel',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\SubscriptionController::cancel
* @see app/Http/Controllers/SubscriptionController.php:283
* @route '/api/subscription/cancel'
*/
cancel.url = (options?: RouteQueryOptions) => {
    return cancel.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SubscriptionController::cancel
* @see app/Http/Controllers/SubscriptionController.php:283
* @route '/api/subscription/cancel'
*/
cancel.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cancel.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SubscriptionController::cancel
* @see app/Http/Controllers/SubscriptionController.php:283
* @route '/api/subscription/cancel'
*/
const cancelForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: cancel.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SubscriptionController::cancel
* @see app/Http/Controllers/SubscriptionController.php:283
* @route '/api/subscription/cancel'
*/
cancelForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: cancel.url(options),
    method: 'post',
})

cancel.form = cancelForm

const SubscriptionController = { validatePayment, status, setupIntent, startTrial, cancelTrial, convertToSubscription, reactivate, cancel }

export default SubscriptionController