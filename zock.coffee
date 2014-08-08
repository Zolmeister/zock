FakeXMLHttpRequest =
  require './components/fake-xml-http-request/fake_xml_http_request'

Router = require('routes')

routers =
  get: Router()

class Zock
  constructor: (@baseUrl) ->
    return this

  get: (@route) ->
    @currentRouter = routers.get
    return this

  reply: (status, body) ->
    url = @baseUrl + @route

    @currentRouter.addRoute url, ->
      return {
        status: status
        body: body
      }

    return this

  open: (method, url) ->
    res = routers[method.toLowerCase()].match url

  send: () ->
    request = new FakeXMLHttpRequest()
    request.respond()

  XMLHttpRequest: =>
    return this


if typeof window != 'undefined'
  window.Zock = Zock

module.exports = Zock
