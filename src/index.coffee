_ = require 'lodash'
qs = require 'qs'
URL = require 'url'
Router = require 'routes'
FakeXMLHttpRequest = require 'fake-xml-http-request'

if window?
  originalXMLHttpRequest = window.XMLHttpRequest
  originalFetch = window.fetch
else
  # Avoid webpack include
  httpReq = 'http'
  http = require httpReq
  originalHttpRequest = http.request
  eventsReq = 'events'
  events = require eventsReq
  streamReq = 'stream'
  stream = require streamReq

  class MockIncomingResponse extends stream.Readable
    constructor: ({@method, @statusCode, @headers}) ->
      super()
      @headers ?= {}
      @httpVersion = '1.1'
      @rawHeaders = {}
      @trailers = {}
      @rawTrailers = {}
      @url = ''
      @statusMessage = 'STATUS MESSAGE'
      @socket = null
    _read: -> undefined
    setTimeout: -> null

  class MockClientRequest extends events.EventEmitter
    ###
    @params {Object} request
    @params {String} request.method
    @params {String} request.url
    @params {RouterResponse} request.response
    ###
    constructor: (@request) -> null
    flushHeaders: -> null
    write: (@body) => null
    end: =>
      try
        bodyParams = JSON.parse @body
      catch err
        bodyParams = {}

      queryParams = qs.parse(URL.parse(@request.url).query)

      res = @request.response.fn(
        params: @request.response.params
        query: queryParams
        body: bodyParams
        headers: @request.headers
      )

      mockIncomingResponse = new MockIncomingResponse({
        method: @request.method
        statusCode: res.statusCode
        headers: @request.headers
      })

      @request.cb(mockIncomingResponse)
      @emit 'response', mockIncomingResponse
      mockIncomingResponse.push res.body
      mockIncomingResponse.push null
    abort: -> null
    setTimeout: -> null
    setNoDelay: -> null
    setSocketKeepAlive: -> null

resultsToRouters = (results) ->
  _.reduce results, (routers, result) ->
    routers[result.method] ?= Router()
    routers[result.method].addRoute result.url, (request) ->
      # FIXME: this is wrong, it assumes a JSON object always
      body = if _.isFunction result.body
        result.body request
      else
        result.body

      _.defaults {
        body: JSON.stringify(body) or null
      }, result
    return routers
  , {}

parseNodeHeaders = (headers) ->
  _.mapValues headers or {}, (val, key) ->
    keepAsArrays = ['set-cookie', 'cookie']
    if not _.includes(keepAsArrays, key) and _.isArray val
      val.join ','
    else
      val

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
  withOverrides: (fn) =>
    if window?
      window.fetch = @fetch()
      window.XMLHttpRequest = => new @XMLHttpRequest()
    else
      http.request = @nodeRequest()

    restore = ->
      if window?
        window.XMLHttpRequest = originalXMLHttpRequest
        window.fetch = originalFetch
      else
        http.request = originalHttpRequest

    new Promise (resolve) ->
      resolve fn()
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
        statusCode: status
        body
        url: (state.baseUrl or '') + state.path
        method: state.method
      }

      _.defaults {results}, state

  logger: (logFn) =>
    @bind (state) ->
      _.defaults {logFn}, state

  fetch: =>
    log = @state.logFn or -> null
    routers = resultsToRouters @state.results

    (url, opts = {}) ->
      method = opts.method or 'get'

      log "#{method} #{url}"

      parsed = URL.parse url
      delete parsed.query
      delete parsed.hash
      delete parsed.search
      delete parsed.path

      response = routers[method.toLowerCase()]?.match(URL.format(parsed))
      unless response
        return originalFetch.apply null, arguments

      try
        bodyParams = JSON.parse opts?.body
      catch err
        bodyParams = {}

      queryParams = qs.parse(URL.parse(url).query)
      res = response.fn(
        params: response.params
        query: queryParams
        body: bodyParams
        headers: opts.headers
      )
      status = res.statusCode or 200
      headers = new Headers res.headers or {}
      body = res.body

      window.Promise.resolve new window.Response(body, {url, status, headers})

  nodeRequest: =>
    log = @state.logFn or -> null
    routers = resultsToRouters @state.results

    (opts, cb = -> null) ->
      headers = parseNodeHeaders opts.headers or {}

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
        return originalHttpRequest.apply http, arguments

      mock = new MockClientRequest({method, response, url, cb, headers})
      if opts.body?
        mock.write opts.body
      return mock


  XMLHttpRequest: =>
    log = @state.logFn or -> null
    request = new FakeXMLHttpRequest()
    response = null
    routers = resultsToRouters @state.results

    oldOpen = request.open
    oldSend = request.send
    oldSetRequestHeader = request.setRequestHeader

    url = null
    method = null
    headers = {}

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
        headers: headers
      )
      status = res.statusCode or 200
      resHeaders = res.headers or {}
      body = res.body

      respond = -> request.respond(status, resHeaders, body)

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

    setRequestHeader = (header, value) ->
      headers[header] = value

    request.open = ->
      open.apply null, arguments
      oldOpen.apply request, arguments

    request.send = ->
      send.apply null, arguments
      oldSend.apply request, arguments

    request.setRequestHeader = ->
      setRequestHeader.apply null, arguments
      oldSetRequestHeader.apply request, arguments

    return request

module.exports = new Zock()
