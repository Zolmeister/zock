_ = require 'lodash'
qs = require 'qs'
URL = require 'url'
Router = require 'routes'
FakeXMLHttpRequest = require 'fake-xml-http-request'

unless window?
  # Avoid webpack include
  httpReq = 'http'
  http = require httpReq
  eventsReq = 'events'
  events = require eventsReq

  class MockIncomingResponse extends events.EventEmitter
    constructor: ({@method, @statusCode}) ->
      @httpVersion = '1.1'
      @headers = {}
      @rawHeaders = {}
      @trailers = {}
      @rawTrailers = {}
      @url = ''
      @statusMessage = 'OK'
      @socket = null
    setTimeout: -> null

  class MockClientRequest extends events.EventEmitter
    constructor: ({@method, @url, @response, @cb}) -> null
    flushHeaders: -> null
    write: (@body) => null
    end: =>
      try
        bodyParams = JSON.parse @body
      catch err
        bodyParams = {}

      queryParams = qs.parse(URL.parse(@url).query)

      res = @response.fn(
        params: @response.params
        query: queryParams
        body: bodyParams
      )

      mockIncomingResponse = new MockIncomingResponse({
        @method
        statusCode: res.statusCode
      })

      @cb(mockIncomingResponse)
      mockIncomingResponse.emit 'data', res.body
      mockIncomingResponse.emit 'end'
    abort: -> null
    setTimeout: -> null
    setNoDelay: -> null
    setSocketKeepAlive: -> null

resultsToRouters = (results) ->
  _.reduce results, (routers, result) ->
    routers[result.method] ?= Router()
    routers[result.method].addRoute result.url, (request) ->
      # FIXME: this is wrong
      if _.isFunction result.body
        result.body = result.body request
      result.body = JSON.stringify result.body
      return result
    return routers
  , {}

class Zock
  constructor: (@state = {}) -> null

  bind: (transform) =>
    new Zock(transform(@state))

  toString: =>
    JSON.stringify @state

  base: (baseUrl) =>
    @bind (state) ->
      _.defaults {baseUrl}, state

  request: (path, method) =>
    @bind (state) ->
      _.defaults {path, method}, state

  get: (path) => @request(path, 'get')
  post: (path) => @request(path, 'post')
  put: (path) => @request(path, 'put')
  withOverride: (fn) =>
    if window?
      originalRequest = window.XMLHttpRequest
      window.XMLHttpRequest = => new @XMLHttpRequest()
    else
      originalRequest = http.request
      http.request = @nodeRequest()

    restore = ->
      if window?
        window.XMLHttpRequest = originalRequest
      else
        http.request = originalRequest

    Promise.resolve fn()
    .then (res) ->
      restore()
      return res
    .catch (err) ->
      restore()
      throw err

  reply: (status, body) =>
    unless _.isNumber status
      body = status
      status = 200

    @bind (state) ->
      results = (state.results or []).concat {
        status
        body
        url: (state.baseUrl or '') + state.path
        method: state.method
      }

      _.defaults {results}, state

  logger: (logFn) =>
    @bind (state) ->
      _.defaults {logFn}, state

  nodeRequest: =>
    log = @state.logFn or -> null
    routers = resultsToRouters @state.results

    (opts, cb) ->
      method = opts.method or 'get'
      hostname = opts.hostname or opts.host.split(':')[0]
      base = if opts.port \
        then "http://#{hostname}:#{opts.port}"
        else "http://#{hostname}"
      url = base + (opts.path or '/')

      log "#{method} #{url}"

      parsed = URL.parse url
      delete parsed.query
      delete parsed.hash
      delete parsed.search
      delete parsed.path


      response = routers[method.toLowerCase()]?.match(URL.format(parsed))
      unless response
        throw new Error("No route for #{method} #{url}")
      new MockClientRequest({method, response, url, cb})

  XMLHttpRequest: =>
    log = @state.logFn or -> null
    request = new FakeXMLHttpRequest()
    response = null
    routers = resultsToRouters @state.results

    oldOpen = request.open
    oldSend = request.send

    url = null
    method = null

    send = (data) ->
      if not response
        throw new Error("No route for #{method} #{url}")

      try
        bodyParams = JSON.parse data
      catch err
        bodyParams = {}

      queryParams = qs.parse(URL.parse(request.url).query)

      res = response.fn(
        params: response.params
        query: queryParams
        body: bodyParams
      )
      status = res.statusCode or 200
      headers = res.headers or {'Content-Type': 'application/json'}
      body = res.body

      respond = -> request.respond(status, headers, body)

      setTimeout respond, 0

    open = (_method, _url) ->
      url = _url
      method = _method

      log "#{method} #{url}"

      parsed = URL.parse url
      delete parsed.query
      delete parsed.hash
      delete parsed.search
      delete parsed.path

      response = routers[method.toLowerCase()]?.match URL.format(parsed)

    request.open = ->
      open.apply null, arguments
      oldOpen.apply request, arguments

    request.send = ->
      send.apply null, arguments
      oldSend.apply request, arguments

    return request

module.exports = new Zock()
