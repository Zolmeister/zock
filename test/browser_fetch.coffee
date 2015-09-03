require './polyfill'

assert = require 'assert'

zock = require '../src'

describe 'fetch', ->
  unless window? and window.fetch
    return

  it 'should get', ->
    fetch = zock
      .base('http://baseurl.com')
      .get('/test')
      .reply(200, {hello: 'world'}).fetch()

    fetch 'http://baseurl.com/test'
    .then (res) ->
      res.text()
    .then (text) ->
      assert.equal text, JSON.stringify({hello: 'world'})

  it 'should get with pathed base', ->
    fetch = zock
      .base('http://baseurl.com/api')
      .get('/test')
      .reply(200, {hello: 'world'}).fetch()

    fetch 'http://baseurl.com/api/test'
    .then (res) ->
      res.text()
    .then (text) ->
      assert.equal text, JSON.stringify({hello: 'world'})

  it 'supports multiple bases', ->
    fetch = zock
      .base('http://baseurl.com/api')
      .get('/test')
      .reply(200, {hello: 'world'})
      .base('http://somedomain.com')
      .get('/test')
      .reply(200, {hello: 'world'}).fetch()

    fetch 'http://baseurl.com/api/test'
    .then (res) ->
      res.text()
    .then (text) ->
      assert.equal text, JSON.stringify({hello: 'world'})

      fetch 'http://somedomain.com/test'
      .then (res) ->
        res.text()
      .then (text) ->
        assert.equal text, JSON.stringify({hello: 'world'})

  it 'should post', ->
    fetch = zock
      .base('http://baseurl.com')
      .post('/test')
      .reply(200, {hello: 'post'}).fetch()

    fetch 'http://baseurl.com/test', {method: 'POST'}
    .then (res) ->
      res.text()
    .then (text) ->
      assert.equal text, JSON.stringify({hello: 'post'})

  it 'should post data', (done) ->
    fetch = zock
      .base('http://baseurl.com')
      .post('/test')
      .reply(200, (res) ->
        assert.deepEqual res.body, {something: 'cool'}
        done()
      ).fetch()

    fetch 'http://baseurl.com/test', {
      method: 'POST'
      body: JSON.stringify {something: 'cool'}
    }

  it 'should put', ->
    fetch = zock
      .base('http://baseurl.com')
      .put('/test')
      .reply(200, {hello: 'put'}).fetch()

    fetch 'http://baseurl.com/test', {method: 'PUT'}
    .then (res) ->
      res.text()
    .then (text) ->
      assert.equal text, JSON.stringify({hello: 'put'})

  it 'should put data', ->
    fetch = zock
      .base('http://baseurl.com')
      .put('/test')
      .reply(200, (res) ->
        assert.deepEqual res.body, {something: 'cool'}
      ).fetch()

    fetch 'http://baseurl.com/test', {
      method: 'PUT'
      body: JSON.stringify {something: 'cool'}
    }

  it 'should get multiple at the same time', ->
    fetch = zock
      .base('http://baseurl.com')
      .get('/test')
      .reply(200, {hello: 'world'})
      .get('/hello')
      .reply(200, {test: 'test'}).fetch()

    Promise.all [
      fetch 'http://baseurl.com/test'
      fetch 'http://baseurl.com/hello'
    ]
    .then ([res1, res2]) ->
      Promise.all [
        res1.text()
        res2.text()
      ]
    .then ([text1, text2]) ->
      assert.equal text1, JSON.stringify({hello: 'world'})
      assert.equal text2, JSON.stringify({test: 'test'})

  it 'should ignore query params and hashes', ->
    fetch = zock
      .base('http://baseurl.com')
      .get('/test')
      .reply(200, {hello: 'world'}).fetch()

    fetch 'http://baseurl.com/test?test=123#hash'
    .then (res) ->
      res.text()
    .then (text) ->
      assert.equal text, JSON.stringify({hello: 'world'})

  it 'logs', ->
    log = 'null'

    fetch = zock
      .logger (x) -> log = x
      .base('http://baseurl.com')
      .get('/test')
      .reply(200, {hello: 'world'}).fetch()

    fetch 'http://baseurl.com/test?test=123#hash'
    .then (res) ->
      res.text()
    .then (text) ->
      assert.equal log, 'get http://baseurl.com/test?test=123#hash'

  it 'has optional status', ->
    fetch = zock
      .base('http://baseurl.com')
      .get('/test')
      .reply({hello: 'world'}).fetch()

    fetch 'http://baseurl.com/test'
    .then (res) ->
      res.text()
    .then (text) ->
      assert.equal text, JSON.stringify({hello: 'world'})

  it 'supports functions for body', ->
    fetch = zock
      .base('http://baseurl.com')
      .post('/test/:name')
      .reply (res) ->
        return res
      .fetch()

    fetch 'http://baseurl.com/test/joe?q=t&p=plumber',
      method: 'POST'
      headers:
        'h1': 'head'
      body: JSON.stringify {x: 'y'}
    .then (res) ->
      res.text()
    .then (text) ->
      parsed = JSON.parse(text)
      assert.equal parsed.params.name, 'joe'
      assert.equal parsed.query.q, 't'
      assert.equal parsed.query.p, 'plumber'
      assert.equal parsed.headers.h1, 'head'
      assert.equal parsed.body.x, 'y'

  it 'withOverrides', ->
    zock
      .base('http://baseurl.com')
      .get('/test')
      .reply(200, {hello: 'world'})
      .withOverrides ->
        window.fetch 'http://baseurl.com/test'
        .then (res) ->
          res.text()
        .then (text) ->
          assert.equal text, JSON.stringify({hello: 'world'})

  it 'removes override after completion', ->
    originalFetch = window.fetch
    zock
    .withOverrides ->
      assert window.fetch isnt originalFetch
    .then ->
      assert.equal window.fetch, originalFetch
