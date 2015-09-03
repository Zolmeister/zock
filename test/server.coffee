assert = require 'assert'

zock = require '../src'

unless window?
  httpReq = 'http'
  http = require httpReq

describe 'http', ->
  if window?
    return

  it 'should get', (done) ->
    request = zock
      .base('http://baseurl.com')
      .get('/test')
      .reply(200, {hello: 'world'})
      .nodeRequest()

    opts =
      host: 'baseurl.com'
      path: '/test'

    req = request opts, (res) ->
      body = ''
      res.on 'data', (chunk) ->
        body += chunk
      res.on 'end', ->
        assert.equal body, JSON.stringify {hello: 'world'}
        done()
      res.on 'error', done

    req.end()

  it 'should get with pathed base', (done) ->
    request = zock
      .base('http://baseurl.com/api')
      .get('/test')
      .reply(200, {hello: 'world'}).nodeRequest()

    opts =
      host: 'baseurl.com'
      path: '/api/test'

    req = request opts, (res) ->
      body = ''
      res.on 'data', (chunk) ->
        body += chunk
      res.on 'end', ->
        assert.equal body, JSON.stringify {hello: 'world'}
        done()
      res.on 'error', done

    req.end()

  it 'supports multiple bases', (done) ->
    request = zock
      .base('http://baseurl.com/api')
      .get('/test')
      .reply(200, {hello: 'world'})
      .base('http://somedomain.com')
      .get('/test')
      .reply(200, {hello: 'world2'}).nodeRequest()

    opts =
      host: 'baseurl.com'
      path: '/api/test'

    req = request opts, (res) ->
      body = ''
      res.on 'data', (chunk) ->
        body += chunk
      res.on 'end', ->
        assert.equal body, JSON.stringify {hello: 'world'}

        opts =
          host: 'somedomain.com'
          path: '/test'

        req = request opts, (res) ->
          body = ''
          res.on 'data', (chunk) ->
            body += chunk
          res.on 'end', ->
            assert.equal body, JSON.stringify {hello: 'world2'}
            done()
          res.on 'error', done

        req.end()
      res.on 'error', done

    req.end()

  it 'supports functions for body', (done) ->
    request = zock
      .base('http://baseurl.com')
      .post('/test/:name')
      .reply (res) ->
        return res
      .nodeRequest()

    opts =
      method: 'post'
      headers:
        h1: 'head'
        cookie: ['xxx']
        'set-cookie': ['yyy']
        reg: ['one']
      host: 'baseurl.com'
      path: '/test/joe?q=t&p=plumber'
      body: JSON.stringify
        x: 'y'

    req = request opts, (res) ->
      body = ''
      res.on 'data', (chunk) ->
        body += chunk
      res.on 'end', ->
        parsed = JSON.parse(body)
        assert.equal parsed.params.name, 'joe'
        assert.equal parsed.query.q, 't'
        assert.equal parsed.query.p, 'plumber'
        assert.equal parsed.headers.h1, 'head'
        assert.equal parsed.headers.reg, 'one'
        assert.deepEqual parsed.headers.cookie, ['xxx']
        assert.deepEqual parsed.headers['set-cookie'], ['yyy']
        assert.equal parsed.body.x, 'y'
        done()
      res.on 'error', done

    req.end()

  it 'should post', (done) ->
    request = zock
      .base('http://baseurl.com')
      .post('/test')
      .reply(200, {hello: 'post'}).nodeRequest()

    opts =
      method: 'post'
      host: 'baseurl.com'
      path: '/test'

    req = request opts, (res) ->
      body = ''
      res.on 'data', (chunk) ->
        body += chunk
      res.on 'end', ->
        assert.equal body, JSON.stringify {hello: 'post'}
        done()
      res.on 'error', done

    req.end()

  it 'should post data', (done) ->
    request = zock
      .base('http://baseurl.com')
      .post('/test')
      .reply(200, (res) ->
        assert.deepEqual res.body, {something: 'cool'}
        done()
      ).nodeRequest()

    opts =
      method: 'post'
      host: 'baseurl.com'
      path: '/test'

    req = request opts, (res) -> null

    req.write '{"something": "cool"}'
    req.end()

  it 'should put', (done) ->
    request = zock
      .base('http://baseurl.com')
      .put('/test')
      .reply(200, {hello: 'put'}).nodeRequest()

    opts =
      method: 'put'
      host: 'baseurl.com'
      path: '/test'

    req = request opts, (res) ->
      body = ''
      res.on 'data', (chunk) ->
        body += chunk
      res.on 'end', ->
        assert.equal body, JSON.stringify {hello: 'put'}
        done()
      res.on 'error', done

    req.end()

  it 'should put data', (done) ->
    request = zock
      .base('http://baseurl.com')
      .put('/test')
      .reply(200, (res) ->
        assert.deepEqual res.body, {something: 'cool'}
        done()
      ).nodeRequest()

    opts =
      method: 'put'
      host: 'baseurl.com'
      path: '/test'

    req = request opts, (res) -> null

    req.write '{"something": "cool"}'
    req.end()

  it 'should get multiple at the same time', (done) ->
    request = zock
      .base('http://baseurl.com')
      .get('/test')
      .reply(200, {hello: 'world'})
      .get('/hello')
      .reply(200, {test: 'test'}).nodeRequest()

    resCnt = 0
    opts1 =
      host: 'baseurl.com'
      path: '/test'

    opts2 =
      host: 'baseurl.com'
      path: '/hello'

    req1 = request opts1, (res) ->
      body = ''
      res.on 'data', (chunk) ->
        body += chunk
      res.on 'end', ->
        assert.equal body, JSON.stringify {hello: 'world'}
        resCnt += 1
        if resCnt is 2
          done()
      res.on 'error', done

    req1.end()

    req2 = request opts2, (res) ->
      body = ''
      res.on 'data', (chunk) ->
        body += chunk
      res.on 'end', ->
        assert.equal body, JSON.stringify {test: 'test'}
        resCnt += 1
        if resCnt is 2
          done()
      res.on 'error', done

    req2.end()

  it 'should ignore query params and hashes', (done) ->
    request = zock
      .base('http://baseurl.com')
      .get('/test')
      .reply(200, {hello: 'world'}).nodeRequest()

    opts =
      host: 'baseurl.com'
      path: '/test?test=123#hash'

    req = request opts, (res) ->
      body = ''
      res.on 'data', (chunk) ->
        body += chunk
      res.on 'end', ->
        assert.equal body, JSON.stringify {hello: 'world'}
        done()
      res.on 'error', done

    req.end()

  it 'logs', (done) ->
    log = 'null'

    request = zock
      .logger (x) -> log = x
      .base('http://baseurl.com')
      .get('/test')
      .reply(200, {hello: 'world'}).nodeRequest()

    opts =
      host: 'baseurl.com'
      path: '/test?test=123#hash'

    req = request opts, (res) ->
      res.on 'data', -> null
      res.on 'end', ->
        assert.equal log, 'get http://baseurl.com/test?test=123#hash'
        done()
      res.on 'error', done

    req.end()

  it 'has optional status', (done) ->
    request = zock
      .base('http://baseurl.com')
      .get('/test')
      .reply({hello: 'world'}).nodeRequest()

    opts =
      host: 'baseurl.com'
      path: '/test'

    req = request opts, (res) ->
      body = ''
      res.on 'data', (chunk) ->
        body += chunk
      res.on 'end', ->
        assert.equal body, JSON.stringify {hello: 'world'}
        done()
      res.on 'error', done

    req.end()

  it 'withOverrides', ->
    zock
      .base('http://baseurl.com')
      .get('/test')
      .reply({hello: 'world'})
      .withOverrides ->
        new Promise (resolve, reject) ->
          opts =
            host: 'baseurl.com'
            path: '/test'

          req = http.request opts, (res) ->
            body = ''
            res.on 'data', (chunk) ->
              body += chunk
            res.on 'end', ->
              assert.equal body, JSON.stringify {hello: 'world'}
              resolve()
            res.on 'error', reject

          req.end()

  it 'removes override after completion', ->
    original = http.request
    zock
    .withOverrides ->
      null
    .then ->
      assert.equal http.request, original
