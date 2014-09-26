# Zock [![Build Status](https://drone.io/github.com/claydotio/zock/status.png)](https://drone.io/github.com/claydotio/zock/latest)

Zock is an HTTP mocking library for the browser  
Similar to [Nock](https://github.com/pgte/nock) (but client side)  

Currently Zock is mostly incomplete, but accepting contributions

## Install

```sh
$ bower install zock
```

## Usage

```js
window.XMLHttpRequest = new Zock()
  .base('http://baseurl.com')
  .get('/test')
  .reply(200, {hello: 'world'})
  .get('/anotherRoute')
  .reply(200, {hello: 'world'})
  .post('postroute')
  .reply(200, {hello: 'post'})
  .get('/test/:name')
  .reply(function(req) {
    // req.params = path params
    // req.query = query params

    return req
  })
  .XMLHttpRequest
```

### base({String} path)

Set the base url that the following routes will be based from

### get({String} route)

Begin defining a mocked GET request

### post({String} route)

Begin defining a mocked POST request

### reply({String} [status]=200, {Object|Function} response)

Define reply for the previously defined mock request

### logger({Function} logger)

Bind a logging function for debugging

```js
new Zock()
.logger(function(debug) {
  console.log(debug)
})
```

### XMLHttpRequest

Return special XMLHttpRequest stub object based on previous setup

## Contributing

The source file is `zock.coffee`

```sh
$ npm -d install
$ npm test
```
