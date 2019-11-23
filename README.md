# Zock [![Build Status](https://drone.io/github.com/claydotio/zock/status.png)](https://drone.io/github.com/claydotio/zock/latest)

Zock is an HTTP mocking library for **both** node.js and the browser
Similar to [Nock](https://github.com/pgte/nock) (but isomorphic)

Contributions weclome!

## Install

```sh
$ npm install zock
```

## Usage

```js
require('coffee-script/register') // register coffee-script
var request = require('clay-request')
var zock = require('zock')

zock
  .base('http://baseurl.com')
  .get('/test')
  .reply(200, {hello: 'world'})
  .get('/anotherRoute')
  .reply(200, {hello: 'world'})
  .post('postroute')
  .reply({hello: 'post'})
  .get('/test/:name')
  .reply(function(req) {
    // req.params = path params
    // req.query = query params
    // req.body = post body (only supports JSON at the moment)
    return req
  })
  .withOverrides(function() {
    request('http://baseurl.com/test')
    .then(function (result) {
      // result = {hello: 'world'}
    })
  })


// permanent browser
window.XMLHttpRequest = zock
  .base('http://baseurl.com')
  .get('/test')
  .reply(200, {hello: 'world'})
  .XMLHttpRequest

window.fetch = zock
  .base('http://baseurl.com')
  .get('/test')
  .reply(200, {hello: 'world'})
  .fetch()

// permanent node.js
http = require 'http'
http.request = zock
  .base('http://baseurl.com')
  .get('/test')
  .reply(200, {hello: 'world'})
  .nodeRequest()
```

### base({String} path)

Set the base url that the following routes will be based from

### get({String} route)

Begin defining a mocked GET request

### post({String} route)

Begin defining a mocked POST request

### put({String} route)

Begin defining a mocked PUT request

### exoid({String} path)

Begin defining a mocked Exoid request
see https://github.com/Zorium/exoid for more information

### reply({String} [status]=200, {Object|Function} response)

Define reply for the previously defined mock request
Second parameter is a function to override entire response object instead of using return value as body

### logger({Function} logger)

Bind a logging function for debugging

```js
zock
.logger(function(debug) {
  console.log(debug)
})
```

### XMLHttpRequest

Return special XMLHttpRequest stub object based on previous setup

### fetch

Return special fetch stub object based on previous setup

### nodeRequest({Boolean} [isHttps]=false)

Return special http.request (or https.request) stub object based on previous setup

### withOverrides({Function} testCode)

runs the function passed in with global overrides enabled, and removes after the function returns
Supports promises

### allowOutbound()

Allow outbound network requests

## Contributing

```sh
$ npm -d install
$ npm test
```

## Changelog

0.2.10 -> 0.3.0
  - [node] support https
  - outbound requests fail by default
  - add `allowOutbound()`

0.1.3 -> 0.2.0
  - rename withOverride to withOverrides
  - add window.fetch support
