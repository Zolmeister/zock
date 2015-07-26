_ = require 'lodash'
URL = require 'url'
Router = require 'routes'
FakeXMLHttpRequest = require 'fake-xml-http-request'

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

  XMLHttpRequest: =>
    log = @state.logFn or -> null
    request = new FakeXMLHttpRequest()
    response = null
    routers = _.reduce @state.results, (routers, result) ->
      routers[result.method] ?= Router()
      routers[result.method].addRoute result.url, (request) ->
        # FIXME: this is wrong
        if _.isFunction result.body
          result.body = result.body request
        result.body = JSON.stringify result.body
        return result
      return routers
    , {}

    oldOpen = request.open
    oldSend = request.send

    url = null
    method = null

    extractQuery = (url) ->
      parsed = URL.parse url
      obj = {}
      if parsed.query
        for pair in parsed.query.split '&'
          [key, value] = pair.split '='
          obj[key] = value

      return obj

    send = (data) ->
      if not response
        throw new Error("No route for #{method} #{url}")

      try
        bodyParams = JSON.parse data
      catch err
        bodyParams = {}

      queryParams = extractQuery(request.url)

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

module.exports = Zock
