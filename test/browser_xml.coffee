b = require 'b-assert'

zock = require '../src'

onComplete = (xmlhttp, fn) ->
  xmlhttp.onreadystatechange = ->
    if xmlhttp.readyState is 4
      fn()

describe 'XMLHttpRequest', ->
  it 'should get', (done) ->
    xmlhttp = zock
      .base('http://baseurl.com')
      .get('/test')
      .reply(200, {hello: 'world'}).XMLHttpRequest()

    onComplete xmlhttp, ->
      res = xmlhttp.responseText
      b res, JSON.stringify({hello: 'world'})
      done()

    xmlhttp.open('get', 'http://baseurl.com/test')
    xmlhttp.send()

  it 'should fail if syncronous', (done) ->
    xmlhttp = zock.XMLHttpRequest()
    try
      xmlhttp.open('get', 'http://baseurl.com/test', false)
      done(new Error 'Expected error')
    catch
      done()

  it 'should get with pathed base', (done) ->
    xmlhttp = zock
      .base('http://baseurl.com/api')
      .get('/test')
      .reply(200, {hello: 'world'}).XMLHttpRequest()

    onComplete xmlhttp, ->
      res = xmlhttp.responseText
      b res, JSON.stringify({hello: 'world'})
      done()

    xmlhttp.open('get', 'http://baseurl.com/api/test')
    xmlhttp.send()

  it 'supports multiple bases', (done) ->
    mock = zock
      .base('http://baseurl.com/api')
      .get('/test')
      .reply(200, {hello: 'world'})
      .base('http://somedomain.com')
      .get('/test')
      .reply(200, {hello: 'world'})

    xmlhttpGen = ->
      mock.XMLHttpRequest()

    xmlhttp = xmlhttpGen()

    onComplete xmlhttp, ->
      res = xmlhttp.responseText
      b res, JSON.stringify({hello: 'world'})

      xmlhttp = xmlhttpGen()

      onComplete xmlhttp, ->
        res = xmlhttp.responseText
        b res, JSON.stringify({hello: 'world'})
        done()

      xmlhttp.open('get', 'http://somedomain.com/test')
      xmlhttp.send()

    xmlhttp.open('get', 'http://baseurl.com/api/test')
    xmlhttp.send()

  it 'should post', (done) ->
    xmlhttp = zock
      .base('http://baseurl.com')
      .post('/test')
      .reply(200, {hello: 'post'}).XMLHttpRequest()

    onComplete xmlhttp, ->
      res = xmlhttp.responseText
      b res, JSON.stringify({hello: 'post'})
      done()

    xmlhttp.open('post', 'http://baseurl.com/test')
    xmlhttp.send()

  it 'should post data', (done) ->
    xmlhttp = zock
      .base('http://baseurl.com')
      .post('/test')
      .reply(200, (res) ->
        b res.body, {something: 'cool'}
        done()
        return ''
      ).XMLHttpRequest()

    xmlhttp.open('post', 'http://baseurl.com/test')
    xmlhttp.send('{"something": "cool"}')

  it 'should put', (done) ->
    xmlhttp = zock
      .base('http://baseurl.com')
      .put('/test')
      .reply(200, {hello: 'put'}).XMLHttpRequest()

    onComplete xmlhttp, ->
      res = xmlhttp.responseText
      b res, JSON.stringify({hello: 'put'})
      done()

    xmlhttp.open('put', 'http://baseurl.com/test')
    xmlhttp.send()

  it 'should put data', (done) ->
    xmlhttp = zock
      .base('http://baseurl.com')
      .put('/test')
      .reply(200, (res) ->
        b res.body, {something: 'cool'}
        done()
        return ''
      ).XMLHttpRequest()

    xmlhttp.open('put', 'http://baseurl.com/test')
    xmlhttp.send('{"something": "cool"}')

  it 'should get multiple at the same time', (done) ->
    XML = zock
      .base('http://baseurl.com')
      .get('/test')
      .reply(200, {hello: 'world'})
      .get('/hello')
      .reply(200, {test: 'test'}).XMLHttpRequest

    resCnt = 0
    xmlhttp = new XML()
    onComplete xmlhttp, ->
      res = xmlhttp.responseText
      b res, JSON.stringify({hello: 'world'})
      resCnt += 1
      if resCnt is 2
        done()

    xmlhttp2 = new XML()
    xmlhttp2.onreadystatechange = ->
      if xmlhttp2.readyState is 4
        res = xmlhttp2.responseText
        b res, JSON.stringify({test: 'test'})
        resCnt += 1
        if resCnt is 2
          done()


    xmlhttp.open('get', 'http://baseurl.com/test')
    xmlhttp2.open('get', 'http://baseurl.com/hello')
    xmlhttp.send()
    xmlhttp2.send()

  it 'should ignore query params and hashes', (done) ->
    xmlhttp = zock
      .base('http://baseurl.com')
      .get('/test')
      .reply(200, {hello: 'world'}).XMLHttpRequest()

    onComplete xmlhttp, ->
      res = xmlhttp.responseText
      b res, JSON.stringify({hello: 'world'})
      done()

    xmlhttp.open('get', 'http://baseurl.com/test?test=123#hash')
    xmlhttp.send()

  it 'logs', (done) ->
    log = 'null'

    xmlhttp = zock
      .logger (x) -> log = x
      .base('http://baseurl.com')
      .get('/test')
      .reply(200, {hello: 'world'}).XMLHttpRequest()

    onComplete xmlhttp, ->
      b log, 'get http://baseurl.com/test?test=123#hash'
      done()

    xmlhttp.open('get', 'http://baseurl.com/test?test=123#hash')
    xmlhttp.send()

  it 'has optional status', (done) ->
    xmlhttp = zock
      .base('http://baseurl.com')
      .get('/test')
      .reply({hello: 'world'}).XMLHttpRequest()

    onComplete xmlhttp, ->
      res = xmlhttp.responseText
      b res, JSON.stringify({hello: 'world'})
      done()

    xmlhttp.open('get', 'http://baseurl.com/test')
    xmlhttp.send()

  it 'supports functions for body', (done) ->
    xmlhttp = zock
      .base('http://baseurl.com')
      .post('/test/:name')
      .reply (res) ->
        return res
      .XMLHttpRequest()

    onComplete xmlhttp, ->
      res = xmlhttp.responseText
      parsed = JSON.parse(res)
      b parsed.params.name, 'joe'
      b parsed.query.q, 't'
      b parsed.query.p, 'plumber'
      b parsed.headers.h1, 'head'
      b parsed.body.x, 'y'

      done()

    xmlhttp.open('post', 'http://baseurl.com/test/joe?q=t&p=plumber')
    xmlhttp.setRequestHeader 'h1', 'head'
    xmlhttp.send(JSON.stringify {x: 'y'})

  it 'supports promises from functions for body', (done) ->
    xmlhttp = zock
      .base('http://baseurl.com')
      .post('/test/:name')
      .reply (res) ->
        Promise.resolve res
      .XMLHttpRequest()

    onComplete xmlhttp, ->
      res = xmlhttp.responseText
      parsed = JSON.parse(res)
      b parsed.params.name, 'joe'
      b parsed.body.x, 'y'

      done()

    xmlhttp.open('post', 'http://baseurl.com/test/joe')
    xmlhttp.send(JSON.stringify {x: 'y'})

  it 'withOverrides', ->
    zock
      .base('http://baseurl.com')
      .get('/test')
      .reply(200, {hello: 'world'})
      .withOverrides ->
        new Promise (resolve) ->
          xmlhttp = new window.XMLHttpRequest()

          onComplete xmlhttp, ->
            res = xmlhttp.responseText
            b res, JSON.stringify({hello: 'world'})
            resolve()

          xmlhttp.open('get', 'http://baseurl.com/test')
          xmlhttp.send()

  it 'removes override after completion', ->
    originalXML = window.XMLHttpRequest
    zock
    .withOverrides ->
      b window.XMLHttpRequest isnt originalXML
    .then ->
      b window.XMLHttpRequest is originalXML

  it 'supports non-JSON responses', (done) ->
    xmlhttp = zock
      .base('http://baseurl.com')
      .get('/test')
      .reply -> 'abc'
      .XMLHttpRequest()

    onComplete xmlhttp, ->
      res = xmlhttp.responseText
      b res, 'abc'
      done()

    xmlhttp.open('get', 'http://baseurl.com/test')
    xmlhttp.send()

  # TODO: support allowOutbound()
  it 'defaults to rejecting outbound requests', (done) ->
    xmlhttp = zock
      .XMLHttpRequest()

    onComplete xmlhttp, ->
      b xmlhttp.status, 500

      done()

    xmlhttp.open('get', 'https://gwent.io/api/obelix/v1/ping')
    xmlhttp.send()

  it 'supports JSON array responses', (done) ->
    xmlhttp = zock
      .base('http://baseurl.com')
      .get('/test')
      .reply -> [{x: 'y'}]
      .XMLHttpRequest()

    onComplete xmlhttp, ->
      res = xmlhttp.responseText
      b res, '[{"x":"y"}]'
      done()

    xmlhttp.open('get', 'http://baseurl.com/test')
    xmlhttp.send()
