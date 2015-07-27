http = require 'http'
assert = require 'assert'

require './polyfill'
zock = require '../src'

onComplete = (xmlhttp, fn) ->
  xmlhttp.onreadystatechange = ->
    if xmlhttp.readyState is 4
      fn()

describe 'zock', ->
  describe 'node', ->
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
        .get('/test/:name')
        .reply (res) ->
          return res
        .nodeRequest()

      opts =
        host: 'baseurl.com'
        path: '/test/joe?q=t&p=plumber'

      req = request opts, (res) ->
        body = ''
        res.on 'data', (chunk) ->
          body += chunk
        res.on 'end', ->
          parsed = JSON.parse(body)
          assert.equal parsed.params.name, 'joe'
          assert.equal parsed.query.q, 't'
          assert.equal parsed.query.p, 'plumber'
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

  describe 'browser', ->
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

        xmlhttp.onreadystatechange = ->
          if xmlhttp.readyState is 4
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

      xmlhttp.onreadystatechange = ->
        if xmlhttp.readyState is 4
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
