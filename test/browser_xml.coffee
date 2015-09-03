require './polyfill'

assert = require 'assert'

zock = require '../src'

onComplete = (xmlhttp, fn) ->
  xmlhttp.onreadystatechange = ->
    if xmlhttp.readyState is 4
      fn()

describe 'XMLHttpRequest', ->
  unless window?
    return

  it 'should get', (done) ->
    xmlhttp = zock
      .base('http://baseurl.com')
      .get('/test')
      .reply(200, {hello: 'world'}).XMLHttpRequest()

    onComplete xmlhttp, ->
      res = xmlhttp.responseText
      assert.equal res, JSON.stringify({hello: 'world'})
      done()

    xmlhttp.open('get', 'http://baseurl.com/test')
    xmlhttp.send()

  it 'should get with pathed base', (done) ->
    xmlhttp = zock
      .base('http://baseurl.com/api')
      .get('/test')
      .reply(200, {hello: 'world'}).XMLHttpRequest()

    onComplete xmlhttp, ->
      res = xmlhttp.responseText
      assert.equal res, JSON.stringify({hello: 'world'})
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
      assert.equal res, JSON.stringify({hello: 'world'})

      xmlhttp = xmlhttpGen()

      onComplete xmlhttp, ->
        res = xmlhttp.responseText
        assert.equal res, JSON.stringify({hello: 'world'})
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
      assert.equal res, JSON.stringify({hello: 'post'})
      done()

    xmlhttp.open('post', 'http://baseurl.com/test')
    xmlhttp.send()

  it 'should post data', (done) ->
    xmlhttp = zock
      .base('http://baseurl.com')
      .post('/test')
      .reply(200, (res) ->
        assert.deepEqual res.body, {something: 'cool'}
        done()
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
      assert.equal res, JSON.stringify({hello: 'put'})
      done()

    xmlhttp.open('put', 'http://baseurl.com/test')
    xmlhttp.send()

  it 'should put data', (done) ->
    xmlhttp = zock
      .base('http://baseurl.com')
      .put('/test')
      .reply(200, (res) ->
        assert.deepEqual res.body, {something: 'cool'}
        done()
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
      assert.equal res, JSON.stringify({hello: 'world'})
      resCnt += 1
      if resCnt is 2
        done()

    xmlhttp2 = new XML()
    xmlhttp2.onreadystatechange = ->
      if xmlhttp2.readyState is 4
        res = xmlhttp2.responseText
        assert.equal res, JSON.stringify({test: 'test'})
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
      assert.equal res, JSON.stringify({hello: 'world'})
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
      assert.equal log, 'get http://baseurl.com/test?test=123#hash'
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
      assert.equal res, JSON.stringify({hello: 'world'})
      done()

    xmlhttp.open('get', 'http://baseurl.com/test')
    xmlhttp.send()

  it 'supports functions for body', (done) ->
    xmlhttp = zock
      .base('http://baseurl.com')
      .get('/test/:name')
      .reply (res) ->
        return res
      .XMLHttpRequest()

    onComplete xmlhttp, ->
      res = xmlhttp.responseText
      parsed = JSON.parse(res)
      assert.equal parsed.params.name, 'joe'
      assert.equal parsed.query.q, 't'
      assert.equal parsed.query.p, 'plumber'

      done()

    xmlhttp.open('get', 'http://baseurl.com/test/joe?q=t&p=plumber')
    xmlhttp.send()

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
            assert.equal res, JSON.stringify({hello: 'world'})
            resolve()

          xmlhttp.open('get', 'http://baseurl.com/test')
          xmlhttp.send()

  it 'removes override after completion', ->
    originalXML = window.XMLHttpRequest
    zock
    .withOverrides ->
      assert window.XMLHttpRequest isnt originalXML
    .then ->
      assert.equal window.XMLHttpRequest, originalXML
