chai = require 'clay-chai'
chai.should()

Zock = new require('./zock')

describe 'zock', ->
  it 'should get', ->
    xmlhttp = new (new Zock('http://baseurl.com')
      .get('/test')
      .reply(200, {hello: 'world'}).XMLHttpRequest)()

    xmlhttp.onreadystatechange = ->
      xmlhttp.responseText.should.be '{hello: \'world\'}'

    xmlhttp.open('get', 'http://baseurl.com/test')
    xmlhttp.send()
