_ = require 'lodash'
qs = require 'qs'
URL = require 'url'
Router = require 'routes'
FakeXMLHttpRequest = require 'fake-xml-http-request'

if window?
  originalFetch = window.fetch
else
  # Avoid webpack include
  httpReq = 'http'
  http = require httpReq
  originalHttpRequest = http.request
  httpsReq = 'https'
  https = require httpsReq
  originalHttpsRequest = https.request
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
      @socket = {authorized: true}
    _read: -> undefined
    setTimeout: -> null

  class MockClientRequest extends events.EventEmitter
    ###
    @params {Object} request
    @params {String} request.method
    @params {String} request.url
    @params {RouterResponse} request.response
    ###
    constructor: (@request) ->
      super()
      @headers = @request.headers or {}
      @aborted = false
      @connection = null
      @socket = null
    abort: => @aborted = true
    flushHeaders: -> null
    getHeader: (key) => @headers[key]
    removeHeader: (key) => delete @headers[key]
    setHeader: (key, val) => @headers[key] = val
    setNoDelay: -> null
    setTimeout: -> null
    setSocketKeepAlive: -> null
    write: (@body) => null
    end: =>
      try
        bodyParams = JSON.parse @body
      catch
        bodyParams = @body

      queryParams = qs.parse(URL.parse(@request.url).query)

      @request.response.fn
        params: @request.response.params
        query: queryParams
        body: bodyParams
        headers: @request.headers
      .then (res) =>
        mockIncomingResponse = new MockIncomingResponse({
          method: @request.method
          statusCode: res.statusCode
          headers: res.headers
        })
        body = if typeof res.body is 'string'
          res.body
        else
          try
            JSON.stringify res.body
          catch
            String res.body

        @request.cb(mockIncomingResponse)
        @emit 'response', mockIncomingResponse
        mockIncomingResponse.push body
        mockIncomingResponse.push null
      .catch (err) =>
        @emit 'error', err

resultsToRouters = (results) ->
  routers = _.reduce results, (routers, result) ->
    if result.method is 'exoid'
      return routers

    routers[result.method] ?= Router()
    try
      routers[result.method].removeRoute result.url
    routers[result.method].addRoute result.url, (request) ->
      resultOverride = null
      body = if _.isFunction result.body
        result.body request, (override) -> resultOverride = override
      else
        result.body

      Promise.resolve body
      .then (body) ->
        if resultOverride?
          resultOverride
        else
          _.defaults {
            body: if _.isPlainObject(body) then JSON.stringify(body) else body
          }, result
    return routers
  , {}

  bases = _.groupBy results, 'baseUrl'
  routers['post'] ?= Router()
  _.map bases, (results, baseUrl) ->
    routers['post'].addRoute baseUrl + '/exoid', (batchRequest) ->
      cache = []
      Promise.all _.map batchRequest.body.requests, (request) ->
        result = _.find results, {path: request.path}
        unless result?
          return Promise.resolve {
            error: {
              status: 404
              info: "handler not found for path #{request.path}"
            }
          }

        new Promise (resolve) ->
          resolve if _.isFunction result.body
            result.body request, _.defaults {
              cache: (id, resource) ->
                if _.isPlainObject id
                  resource = id
                  id = id.id
                cache.push {path: id, result: resource}
            }, batchRequest
          else
            result.body
        .then (body) -> {response: body}
        .catch (error) ->
          if error._exoid
            {error: {status: error.status, info: error.info}}
          else
            {error: {status: 500}}
      .then (responses) ->
        statusCode: 200
        body: JSON.stringify
          results: _.pluck responses, 'response'
          errors: _.pluck responses, 'error'
          cache: cache

  return routers

parseNodeHeaders = (headers) ->
  _.mapValues headers or {}, (val, key) ->
    keepAsArrays = ['set-cookie', 'cookie']
    if not _.includes(keepAsArrays, key) and _.isArray val
      val.join ','
    else
      val

isLocalhost = (url) ->
  hostname = URL.parse(url).hostname
  hostname is 'localhost' or hostname is '127.0.0.1'

class Zock
  constructor: (@state = {allowOutbound: false}) -> null

  bind: (transform) =>
    new Zock(transform(@state))

  toString: =>
    JSON.stringify @state

  base: (baseUrl) =>
    @bind (state) ->
      _.defaults {baseUrl}, state

  allowOutbound: =>
    @bind (state) ->
      _.defaults {allowOutbound: true}, state

  request: (path, method) =>
    @bind (state) ->
      _.defaults {path, method}, state

  get: (path) => @request(path, 'get')
  post: (path) => @request(path, 'post')
  put: (path) => @request(path, 'put')
  exoid: (path) => @request(path, 'exoid')
  withOverrides: (fn) =>
    if window?
      previousFetch = window.fetch
      window.fetch = @fetch()
      previousXMLHttpRequest = window.XMLHttpRequest
      window.XMLHttpRequest = => new @XMLHttpRequest()
    else
      previousHttpRequest = http.request
      http.request = @nodeRequest()
      previousHttpsRequest = https.request
      https.request = @nodeRequest(true)

    restore = ->
      if window?
        window.XMLHttpRequest = previousXMLHttpRequest
        window.fetch = previousFetch
      else
        http.request = previousHttpRequest
        https.request = previousHttpsRequest

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
        path: state.path
        baseUrl: state.baseUrl
        method: state.method
      }

      _.defaults {results}, state

  logger: (logFn) =>
    @bind (state) ->
      _.defaults {logFn}, state

  fetch: =>
    log = @state.logFn or -> null
    routers = resultsToRouters @state.results
    allowOutbound = @state.allowOutbound

    (url, opts = {}) ->
      method = opts.method or 'get'

      log "#{method} #{url}"

      parsed = URL.parse url
      delete parsed.query
      delete parsed.hash
      delete parsed.search
      delete parsed.path

      response = routers[method.toLowerCase()]?.match(URL.format(parsed))
      unless response?
        if allowOutbound or isLocalhost url
          return originalFetch.apply null, arguments
        else
          response =
            fn: ->
              Promise.reject new Error "Invalid Outbound Request: #{url}"

      try
        bodyParams = JSON.parse opts?.body
      catch
        bodyParams = opts?.body

      queryParams = qs.parse(URL.parse(url).query)
      response.fn
        params: response.params
        query: queryParams
        body: bodyParams
        headers: opts.headers
      .then (res) ->
        status = res.statusCode or 200
        headers = new Headers res.headers or {}
        body = if typeof res.body is 'string'
          res.body
        else
          try
            JSON.stringify res.body
          catch
            String res.body

        new window.Response(body, {url, status, headers})

  nodeRequest: (isHttps = false) =>
    log = @state.logFn or -> null
    routers = resultsToRouters @state.results
    defaultProtocol = if isHttps then 'https:' else 'http:'
    allowOutbound = @state.allowOutbound

    (opts, cb = -> null) ->
      headers = parseNodeHeaders opts.headers or {}

      {method, hostname, protocol} = _.assign {
        method: 'get'
        hostname: opts.host?.split(':')[0]
        protocol: defaultProtocol
      }, opts
      base = "#{protocol}//#{hostname}"
      if opts.port?
        base += ":#{opts.port}"
      url = base + (opts.path or '/')

      log "#{method} #{url}"

      parsed = URL.parse url
      delete parsed.query
      delete parsed.hash
      delete parsed.search
      delete parsed.path

      response = routers[method.toLowerCase()]?.match(URL.format(parsed))
      unless response?
        if allowOutbound or isLocalhost url
          if isHttps
            return originalHttpsRequest.apply https, arguments
          else
            return originalHttpRequest.apply http, arguments
        else
          response =
            fn: ->
              Promise.reject new Error "Invalid Outbound Request: #{url}"

      mock = new MockClientRequest({method, response, url, cb, headers})

      process.nextTick ->
        mock.emit 'socket', {connecting: false}
      if opts.body?
        mock.write opts.body
      return mock


  XMLHttpRequest: =>
    log = @state.logFn or -> null
    request = new FakeXMLHttpRequest()
    response = null
    routers = resultsToRouters @state.results
    allowOutbound = @state.allowOutbound

    oldOpen = request.open
    oldSend = request.send
    oldSetRequestHeader = request.setRequestHeader

    url = null
    method = null
    headers = {}

    send = (data) ->
      if not response?
        if allowOutbound or isLocalhost url
          throw new Error 'Outbound request not implemented for XMLHttpRequest'
        else
          throw new Error "Invalid Outbound Request: #{url}"

      try
        bodyParams = JSON.parse data
      catch
        bodyParams = data

      queryParams = qs.parse(URL.parse(request.url).query)

      response.fn
        params: response.params
        query: queryParams
        body: bodyParams
        headers: headers
      .then (res) ->
        status = res.statusCode or 200
        resHeaders = res.headers or {}
        body = if typeof res.body is 'string'
          res.body
        else
          try
            JSON.stringify res.body
          catch
            String res.body

        respond = -> request.respond(status, resHeaders, body)

        setTimeout respond, 0

    open = (_method, _url, isAsync) ->
      if isAsync is false
        throw new Error 'Syncronous XMLHttpRequest not supported'

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
