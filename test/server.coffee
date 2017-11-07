b = require 'b-assert'
http = require 'http'

zock = require '../src'

describe 'http', ->
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
        b body, JSON.stringify {hello: 'world'}
        done()
      res.on 'error', done

    req.end()
    null

  it 'should get https', (done) ->
    request = zock
      .base('https://baseurl.com')
      .get('/test')
      .reply(200, {hello: 'world'})
      .nodeRequest()

    opts =
      protocol: 'https:'
      host: 'baseurl.com'
      path: '/test'

    req = request opts, (res) ->
      body = ''
      res.on 'data', (chunk) ->
        body += chunk
      res.on 'end', ->
        b body, JSON.stringify {hello: 'world'}
        done()
      res.on 'error', done

    req.end()
    null

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
        b body, JSON.stringify {hello: 'world'}
        done()
      res.on 'error', done

    req.end()
    null

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
        b body, JSON.stringify {hello: 'world'}

        opts =
          host: 'somedomain.com'
          path: '/test'

        req = request opts, (res) ->
          body = ''
          res.on 'data', (chunk) ->
            body += chunk
          res.on 'end', ->
            b body, JSON.stringify {hello: 'world2'}
            done()
          res.on 'error', done

        req.end()
      res.on 'error', done

    req.end()
    null

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
        b parsed.params.name, 'joe'
        b parsed.query.q, 't'
        b parsed.query.p, 'plumber'
        b parsed.headers.h1, 'head'
        b parsed.headers.reg, 'one'
        b parsed.headers.cookie, ['xxx']
        b parsed.headers['set-cookie'], ['yyy']
        b parsed.body.x, 'y'
        done()
      res.on 'error', done

    req.end()
    null


  it 'supports promises from functions for body', (done) ->
    request = zock
      .base('http://baseurl.com')
      .post('/test/:name')
      .reply (res) ->
        Promise.resolve res
      .nodeRequest()

    opts =
      method: 'post'
      host: 'baseurl.com'
      path: '/test/joe'
      body: JSON.stringify
        x: 'y'

    req = request opts, (res) ->
      body = ''
      res.on 'data', (chunk) ->
        body += chunk
      res.on 'end', ->
        parsed = JSON.parse(body)
        b parsed.params.name, 'joe'
        b parsed.body.x, 'y'
        done()
      res.on 'error', done

    req.end()
    null

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
        b body, JSON.stringify {hello: 'post'}
        done()
      res.on 'error', done

    req.end()
    null

  it 'should post data', (done) ->
    request = zock
      .base('http://baseurl.com')
      .post('/test')
      .reply(200, (res) ->
        b res.body, {something: 'cool'}
        done()
      ).nodeRequest()

    opts =
      method: 'post'
      host: 'baseurl.com'
      path: '/test'

    req = request opts, (res) -> null

    req.write '{"something": "cool"}'
    req.end()
    null

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
        b body, JSON.stringify {hello: 'put'}
        done()
      res.on 'error', done

    req.end()
    null

  it 'should put data', (done) ->
    request = zock
      .base('http://baseurl.com')
      .put('/test')
      .reply(200, (res) ->
        b res.body, {something: 'cool'}
        done()
      ).nodeRequest()

    opts =
      method: 'put'
      host: 'baseurl.com'
      path: '/test'

    req = request opts, (res) -> null

    req.write '{"something": "cool"}'
    req.end()
    null

  it 'should exoid', (done) ->
    request = zock
      .base('http://baseurl.com')
      .exoid('test')
      .reply({hello: 'exoid'}).nodeRequest()

    opts =
      method: 'post'
      host: 'baseurl.com'
      path: '/exoid'
      body:
        requests: [
          {path: 'test'}
        ]

    req = request opts, (res) ->
      body = ''
      res.on 'data', (chunk) ->
        body += chunk
      res.on 'end', ->
        b body, JSON.stringify {
          results: [{hello: 'exoid'}]
          errors: [null]
          cache: []
        }
        done()
      res.on 'error', done

    req.end()
    null

  it 'should exoid data', (done) ->
    request = zock
      .base('http://baseurl.com')
      .exoid('test')
      .reply {hello: 'exoid'}
      .exoid('error')
      .reply ->
        throw {_exoid: true, status: 404, info: 'not found'}
      .exoid('testData')
      .reply((req, batchRequest) ->
        b req, {path: 'testData', body: {bb: 'cc'}}
        b batchRequest?
        batchRequest.cache('testpath', 'testvalue')
        return {dd: 'ee'}
      ).nodeRequest()

    opts =
      method: 'post'
      host: 'baseurl.com'
      path: '/exoid'
      body:
        requests: [
          {path: 'test'}
          {path: 'testData', body: {bb: 'cc'}}
          {path: 'error'}
        ]

    req = request opts, (res) ->
      body = ''
      res.on 'data', (chunk) ->
        body += chunk
      res.on 'end', ->
        b body, JSON.stringify {
          results: [{hello: 'exoid'}, {dd: 'ee'}, null]
          errors: [null, null, {status: 404, info: 'not found'}]
          cache: [{path: 'testpath', result: 'testvalue'}]
        }
        done()
      res.on 'error', done

    req.end()
    null

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
        b body, JSON.stringify {hello: 'world'}
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
        b body, JSON.stringify {test: 'test'}
        resCnt += 1
        if resCnt is 2
          done()
      res.on 'error', done

    req2.end()
    null

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
        b body, JSON.stringify {hello: 'world'}
        done()
      res.on 'error', done

    req.end()
    null

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
        b log, 'get http://baseurl.com/test?test=123#hash'
        done()
      res.on 'error', done

    req.end()
    null

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
        b body, JSON.stringify {hello: 'world'}
        done()
      res.on 'error', done

    req.end()
    null

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
              b body, JSON.stringify {hello: 'world'}
              resolve()
            res.on 'error', reject

          req.end()

  it 'removes override after completion', ->
    original = http.request
    zock
    .withOverrides ->
      null
    .then ->
      b http.request is original
