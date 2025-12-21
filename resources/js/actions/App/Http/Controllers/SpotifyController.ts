import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\SpotifyController::redirect
* @see app/Http/Controllers/SpotifyController.php:14
* @route '/auth/spotify'
*/
export const redirect = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: redirect.url(options),
    method: 'get',
})

redirect.definition = {
    methods: ["get","head"],
    url: '/auth/spotify',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SpotifyController::redirect
* @see app/Http/Controllers/SpotifyController.php:14
* @route '/auth/spotify'
*/
redirect.url = (options?: RouteQueryOptions) => {
    return redirect.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SpotifyController::redirect
* @see app/Http/Controllers/SpotifyController.php:14
* @route '/auth/spotify'
*/
redirect.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: redirect.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SpotifyController::redirect
* @see app/Http/Controllers/SpotifyController.php:14
* @route '/auth/spotify'
*/
redirect.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: redirect.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\SpotifyController::redirect
* @see app/Http/Controllers/SpotifyController.php:14
* @route '/auth/spotify'
*/
const redirectForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: redirect.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SpotifyController::redirect
* @see app/Http/Controllers/SpotifyController.php:14
* @route '/auth/spotify'
*/
redirectForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: redirect.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SpotifyController::redirect
* @see app/Http/Controllers/SpotifyController.php:14
* @route '/auth/spotify'
*/
redirectForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: redirect.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

redirect.form = redirectForm

/**
* @see \App\Http\Controllers\SpotifyController::callback
* @see app/Http/Controllers/SpotifyController.php:31
* @route '/auth/spotify/callback'
*/
export const callback = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: callback.url(options),
    method: 'get',
})

callback.definition = {
    methods: ["get","head"],
    url: '/auth/spotify/callback',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SpotifyController::callback
* @see app/Http/Controllers/SpotifyController.php:31
* @route '/auth/spotify/callback'
*/
callback.url = (options?: RouteQueryOptions) => {
    return callback.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SpotifyController::callback
* @see app/Http/Controllers/SpotifyController.php:31
* @route '/auth/spotify/callback'
*/
callback.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: callback.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SpotifyController::callback
* @see app/Http/Controllers/SpotifyController.php:31
* @route '/auth/spotify/callback'
*/
callback.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: callback.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\SpotifyController::callback
* @see app/Http/Controllers/SpotifyController.php:31
* @route '/auth/spotify/callback'
*/
const callbackForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: callback.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SpotifyController::callback
* @see app/Http/Controllers/SpotifyController.php:31
* @route '/auth/spotify/callback'
*/
callbackForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: callback.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SpotifyController::callback
* @see app/Http/Controllers/SpotifyController.php:31
* @route '/auth/spotify/callback'
*/
callbackForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: callback.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

callback.form = callbackForm

/**
* @see \App\Http\Controllers\SpotifyController::disconnect
* @see app/Http/Controllers/SpotifyController.php:50
* @route '/api/spotify/disconnect'
*/
export const disconnect = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: disconnect.url(options),
    method: 'post',
})

disconnect.definition = {
    methods: ["post"],
    url: '/api/spotify/disconnect',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\SpotifyController::disconnect
* @see app/Http/Controllers/SpotifyController.php:50
* @route '/api/spotify/disconnect'
*/
disconnect.url = (options?: RouteQueryOptions) => {
    return disconnect.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SpotifyController::disconnect
* @see app/Http/Controllers/SpotifyController.php:50
* @route '/api/spotify/disconnect'
*/
disconnect.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: disconnect.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SpotifyController::disconnect
* @see app/Http/Controllers/SpotifyController.php:50
* @route '/api/spotify/disconnect'
*/
const disconnectForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: disconnect.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SpotifyController::disconnect
* @see app/Http/Controllers/SpotifyController.php:50
* @route '/api/spotify/disconnect'
*/
disconnectForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: disconnect.url(options),
    method: 'post',
})

disconnect.form = disconnectForm

/**
* @see \App\Http\Controllers\SpotifyController::status
* @see app/Http/Controllers/SpotifyController.php:63
* @route '/api/spotify/status'
*/
export const status = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: status.url(options),
    method: 'get',
})

status.definition = {
    methods: ["get","head"],
    url: '/api/spotify/status',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SpotifyController::status
* @see app/Http/Controllers/SpotifyController.php:63
* @route '/api/spotify/status'
*/
status.url = (options?: RouteQueryOptions) => {
    return status.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SpotifyController::status
* @see app/Http/Controllers/SpotifyController.php:63
* @route '/api/spotify/status'
*/
status.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: status.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SpotifyController::status
* @see app/Http/Controllers/SpotifyController.php:63
* @route '/api/spotify/status'
*/
status.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: status.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\SpotifyController::status
* @see app/Http/Controllers/SpotifyController.php:63
* @route '/api/spotify/status'
*/
const statusForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: status.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SpotifyController::status
* @see app/Http/Controllers/SpotifyController.php:63
* @route '/api/spotify/status'
*/
statusForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: status.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SpotifyController::status
* @see app/Http/Controllers/SpotifyController.php:63
* @route '/api/spotify/status'
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
* @see \App\Http\Controllers\SpotifyController::play
* @see app/Http/Controllers/SpotifyController.php:107
* @route '/api/spotify/play'
*/
export const play = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: play.url(options),
    method: 'post',
})

play.definition = {
    methods: ["post"],
    url: '/api/spotify/play',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\SpotifyController::play
* @see app/Http/Controllers/SpotifyController.php:107
* @route '/api/spotify/play'
*/
play.url = (options?: RouteQueryOptions) => {
    return play.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SpotifyController::play
* @see app/Http/Controllers/SpotifyController.php:107
* @route '/api/spotify/play'
*/
play.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: play.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SpotifyController::play
* @see app/Http/Controllers/SpotifyController.php:107
* @route '/api/spotify/play'
*/
const playForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: play.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SpotifyController::play
* @see app/Http/Controllers/SpotifyController.php:107
* @route '/api/spotify/play'
*/
playForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: play.url(options),
    method: 'post',
})

play.form = playForm

/**
* @see \App\Http\Controllers\SpotifyController::pause
* @see app/Http/Controllers/SpotifyController.php:219
* @route '/api/spotify/pause'
*/
export const pause = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: pause.url(options),
    method: 'post',
})

pause.definition = {
    methods: ["post"],
    url: '/api/spotify/pause',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\SpotifyController::pause
* @see app/Http/Controllers/SpotifyController.php:219
* @route '/api/spotify/pause'
*/
pause.url = (options?: RouteQueryOptions) => {
    return pause.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SpotifyController::pause
* @see app/Http/Controllers/SpotifyController.php:219
* @route '/api/spotify/pause'
*/
pause.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: pause.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SpotifyController::pause
* @see app/Http/Controllers/SpotifyController.php:219
* @route '/api/spotify/pause'
*/
const pauseForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: pause.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SpotifyController::pause
* @see app/Http/Controllers/SpotifyController.php:219
* @route '/api/spotify/pause'
*/
pauseForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: pause.url(options),
    method: 'post',
})

pause.form = pauseForm

/**
* @see \App\Http\Controllers\SpotifyController::next
* @see app/Http/Controllers/SpotifyController.php:233
* @route '/api/spotify/next'
*/
export const next = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: next.url(options),
    method: 'post',
})

next.definition = {
    methods: ["post"],
    url: '/api/spotify/next',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\SpotifyController::next
* @see app/Http/Controllers/SpotifyController.php:233
* @route '/api/spotify/next'
*/
next.url = (options?: RouteQueryOptions) => {
    return next.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SpotifyController::next
* @see app/Http/Controllers/SpotifyController.php:233
* @route '/api/spotify/next'
*/
next.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: next.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SpotifyController::next
* @see app/Http/Controllers/SpotifyController.php:233
* @route '/api/spotify/next'
*/
const nextForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: next.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SpotifyController::next
* @see app/Http/Controllers/SpotifyController.php:233
* @route '/api/spotify/next'
*/
nextForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: next.url(options),
    method: 'post',
})

next.form = nextForm

/**
* @see \App\Http\Controllers\SpotifyController::previous
* @see app/Http/Controllers/SpotifyController.php:252
* @route '/api/spotify/previous'
*/
export const previous = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: previous.url(options),
    method: 'post',
})

previous.definition = {
    methods: ["post"],
    url: '/api/spotify/previous',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\SpotifyController::previous
* @see app/Http/Controllers/SpotifyController.php:252
* @route '/api/spotify/previous'
*/
previous.url = (options?: RouteQueryOptions) => {
    return previous.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SpotifyController::previous
* @see app/Http/Controllers/SpotifyController.php:252
* @route '/api/spotify/previous'
*/
previous.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: previous.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SpotifyController::previous
* @see app/Http/Controllers/SpotifyController.php:252
* @route '/api/spotify/previous'
*/
const previousForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: previous.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SpotifyController::previous
* @see app/Http/Controllers/SpotifyController.php:252
* @route '/api/spotify/previous'
*/
previousForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: previous.url(options),
    method: 'post',
})

previous.form = previousForm

/**
* @see \App\Http\Controllers\SpotifyController::playerState
* @see app/Http/Controllers/SpotifyController.php:287
* @route '/api/spotify/state'
*/
export const playerState = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: playerState.url(options),
    method: 'get',
})

playerState.definition = {
    methods: ["get","head"],
    url: '/api/spotify/state',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SpotifyController::playerState
* @see app/Http/Controllers/SpotifyController.php:287
* @route '/api/spotify/state'
*/
playerState.url = (options?: RouteQueryOptions) => {
    return playerState.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SpotifyController::playerState
* @see app/Http/Controllers/SpotifyController.php:287
* @route '/api/spotify/state'
*/
playerState.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: playerState.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SpotifyController::playerState
* @see app/Http/Controllers/SpotifyController.php:287
* @route '/api/spotify/state'
*/
playerState.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: playerState.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\SpotifyController::playerState
* @see app/Http/Controllers/SpotifyController.php:287
* @route '/api/spotify/state'
*/
const playerStateForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: playerState.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SpotifyController::playerState
* @see app/Http/Controllers/SpotifyController.php:287
* @route '/api/spotify/state'
*/
playerStateForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: playerState.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SpotifyController::playerState
* @see app/Http/Controllers/SpotifyController.php:287
* @route '/api/spotify/state'
*/
playerStateForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: playerState.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

playerState.form = playerStateForm

/**
* @see \App\Http\Controllers\SpotifyController::token
* @see app/Http/Controllers/SpotifyController.php:311
* @route '/api/spotify/token'
*/
export const token = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: token.url(options),
    method: 'get',
})

token.definition = {
    methods: ["get","head"],
    url: '/api/spotify/token',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SpotifyController::token
* @see app/Http/Controllers/SpotifyController.php:311
* @route '/api/spotify/token'
*/
token.url = (options?: RouteQueryOptions) => {
    return token.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SpotifyController::token
* @see app/Http/Controllers/SpotifyController.php:311
* @route '/api/spotify/token'
*/
token.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: token.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SpotifyController::token
* @see app/Http/Controllers/SpotifyController.php:311
* @route '/api/spotify/token'
*/
token.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: token.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\SpotifyController::token
* @see app/Http/Controllers/SpotifyController.php:311
* @route '/api/spotify/token'
*/
const tokenForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: token.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SpotifyController::token
* @see app/Http/Controllers/SpotifyController.php:311
* @route '/api/spotify/token'
*/
tokenForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: token.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SpotifyController::token
* @see app/Http/Controllers/SpotifyController.php:311
* @route '/api/spotify/token'
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
* @see \App\Http\Controllers\SpotifyController::volume
* @see app/Http/Controllers/SpotifyController.php:271
* @route '/api/spotify/volume'
*/
export const volume = (options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: volume.url(options),
    method: 'put',
})

volume.definition = {
    methods: ["put"],
    url: '/api/spotify/volume',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\SpotifyController::volume
* @see app/Http/Controllers/SpotifyController.php:271
* @route '/api/spotify/volume'
*/
volume.url = (options?: RouteQueryOptions) => {
    return volume.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SpotifyController::volume
* @see app/Http/Controllers/SpotifyController.php:271
* @route '/api/spotify/volume'
*/
volume.put = (options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: volume.url(options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\SpotifyController::volume
* @see app/Http/Controllers/SpotifyController.php:271
* @route '/api/spotify/volume'
*/
const volumeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: volume.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SpotifyController::volume
* @see app/Http/Controllers/SpotifyController.php:271
* @route '/api/spotify/volume'
*/
volumeForm.put = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: volume.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

volume.form = volumeForm

/**
* @see \App\Http\Controllers\SpotifyController::seek
* @see app/Http/Controllers/SpotifyController.php:317
* @route '/api/spotify/seek'
*/
export const seek = (options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: seek.url(options),
    method: 'put',
})

seek.definition = {
    methods: ["put"],
    url: '/api/spotify/seek',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\SpotifyController::seek
* @see app/Http/Controllers/SpotifyController.php:317
* @route '/api/spotify/seek'
*/
seek.url = (options?: RouteQueryOptions) => {
    return seek.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SpotifyController::seek
* @see app/Http/Controllers/SpotifyController.php:317
* @route '/api/spotify/seek'
*/
seek.put = (options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: seek.url(options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\SpotifyController::seek
* @see app/Http/Controllers/SpotifyController.php:317
* @route '/api/spotify/seek'
*/
const seekForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: seek.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SpotifyController::seek
* @see app/Http/Controllers/SpotifyController.php:317
* @route '/api/spotify/seek'
*/
seekForm.put = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: seek.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

seek.form = seekForm

/**
* @see \App\Http\Controllers\SpotifyController::saveTrack
* @see app/Http/Controllers/SpotifyController.php:333
* @route '/api/spotify/save-track'
*/
export const saveTrack = (options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: saveTrack.url(options),
    method: 'put',
})

saveTrack.definition = {
    methods: ["put"],
    url: '/api/spotify/save-track',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\SpotifyController::saveTrack
* @see app/Http/Controllers/SpotifyController.php:333
* @route '/api/spotify/save-track'
*/
saveTrack.url = (options?: RouteQueryOptions) => {
    return saveTrack.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SpotifyController::saveTrack
* @see app/Http/Controllers/SpotifyController.php:333
* @route '/api/spotify/save-track'
*/
saveTrack.put = (options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: saveTrack.url(options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\SpotifyController::saveTrack
* @see app/Http/Controllers/SpotifyController.php:333
* @route '/api/spotify/save-track'
*/
const saveTrackForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: saveTrack.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SpotifyController::saveTrack
* @see app/Http/Controllers/SpotifyController.php:333
* @route '/api/spotify/save-track'
*/
saveTrackForm.put = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: saveTrack.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

saveTrack.form = saveTrackForm

/**
* @see \App\Http\Controllers\SpotifyController::removeTrack
* @see app/Http/Controllers/SpotifyController.php:352
* @route '/api/spotify/remove-track'
*/
export const removeTrack = (options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: removeTrack.url(options),
    method: 'delete',
})

removeTrack.definition = {
    methods: ["delete"],
    url: '/api/spotify/remove-track',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\SpotifyController::removeTrack
* @see app/Http/Controllers/SpotifyController.php:352
* @route '/api/spotify/remove-track'
*/
removeTrack.url = (options?: RouteQueryOptions) => {
    return removeTrack.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SpotifyController::removeTrack
* @see app/Http/Controllers/SpotifyController.php:352
* @route '/api/spotify/remove-track'
*/
removeTrack.delete = (options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: removeTrack.url(options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\SpotifyController::removeTrack
* @see app/Http/Controllers/SpotifyController.php:352
* @route '/api/spotify/remove-track'
*/
const removeTrackForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: removeTrack.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SpotifyController::removeTrack
* @see app/Http/Controllers/SpotifyController.php:352
* @route '/api/spotify/remove-track'
*/
removeTrackForm.delete = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: removeTrack.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

removeTrack.form = removeTrackForm

/**
* @see \App\Http\Controllers\SpotifyController::checkSaved
* @see app/Http/Controllers/SpotifyController.php:371
* @route '/api/spotify/check-saved'
*/
export const checkSaved = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: checkSaved.url(options),
    method: 'get',
})

checkSaved.definition = {
    methods: ["get","head"],
    url: '/api/spotify/check-saved',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SpotifyController::checkSaved
* @see app/Http/Controllers/SpotifyController.php:371
* @route '/api/spotify/check-saved'
*/
checkSaved.url = (options?: RouteQueryOptions) => {
    return checkSaved.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SpotifyController::checkSaved
* @see app/Http/Controllers/SpotifyController.php:371
* @route '/api/spotify/check-saved'
*/
checkSaved.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: checkSaved.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SpotifyController::checkSaved
* @see app/Http/Controllers/SpotifyController.php:371
* @route '/api/spotify/check-saved'
*/
checkSaved.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: checkSaved.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\SpotifyController::checkSaved
* @see app/Http/Controllers/SpotifyController.php:371
* @route '/api/spotify/check-saved'
*/
const checkSavedForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: checkSaved.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SpotifyController::checkSaved
* @see app/Http/Controllers/SpotifyController.php:371
* @route '/api/spotify/check-saved'
*/
checkSavedForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: checkSaved.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SpotifyController::checkSaved
* @see app/Http/Controllers/SpotifyController.php:371
* @route '/api/spotify/check-saved'
*/
checkSavedForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: checkSaved.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

checkSaved.form = checkSavedForm

const SpotifyController = { redirect, callback, disconnect, status, play, pause, next, previous, playerState, token, volume, seek, saveTrack, removeTrack, checkSaved }

export default SpotifyController