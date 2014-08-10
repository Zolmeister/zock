# Usage
```js
window.XMLHttpRequest = new Zock()
  .base(window.location.origin)
  .post('/users')
  .reply(200, {hello: 'world'})
  .XMLHttpRequest
```
