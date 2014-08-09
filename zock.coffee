FakeXMLHttpRequest =
  require './components/fake-xml-http-request/fake_xml_http_request'

Router = require('routes')

routers =
  get: Router()

class Zock
  base: (@baseUrl) ->
    return this

  get: (@route) ->
    @currentRouter = routers.get
    return this

  reply: (status, body) ->
    url = @baseUrl + @route

    @currentRouter.addRoute url, ->
      return {
        statusCode: status
        body: JSON.stringify(body)
      }

    return this

  open: (method, url) =>
    @response = routers[method.toLowerCase()].match url

  send: =>
    res = @response.fn()
    status = res.statusCode || 200
    headers = res.headers || {'Content-Type': 'application/json'}
    body = res.body

    respond = => @request.respond(status, headers, body)

    setTimeout respond, 0

  XMLHttpRequest: =>
    @request = new FakeXMLHttpRequest()

    oldOpen = @request.open
    oldSend = @request.send

    @request.open = =>
      @open.apply this, arguments
      oldOpen.apply @request, arguments

    @request.send = =>
      @send.apply this, arguments
      oldSend.apply @request, arguments

    return @request

module.exports = Zock
