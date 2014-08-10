chai = require 'clay-chai'
chai.should()

Zock = new require('./zock.coffee')

describe 'zock', ->
  it 'should get', (done) ->
    xmlhttp = new Zock()
      .base('http://baseurl.com')
      .get('/test')
      .reply(200, {hello: 'world'}).XMLHttpRequest()

    xmlhttp.onreadystatechange = ->
      if xmlhttp.readyState == 4
        res = xmlhttp.responseText
        res.should.be JSON.stringify({hello: 'world'})
        done()

    xmlhttp.open('get', 'http://baseurl.com/test')
    xmlhttp.send()
