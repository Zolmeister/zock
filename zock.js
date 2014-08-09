!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.Zock=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var FakeXMLHttpRequest, Router, Zock, routers,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

FakeXMLHttpRequest = require('./components/fake-xml-http-request/fake_xml_http_request');

Router = require('routes');

routers = {
  get: Router()
};

Zock = (function() {
  function Zock(baseUrl) {
    this.baseUrl = baseUrl;
    this.XMLHttpRequest = __bind(this.XMLHttpRequest, this);
    return this;
  }

  Zock.prototype.get = function(route) {
    this.route = route;
    this.currentRouter = routers.get;
    return this;
  };

  Zock.prototype.reply = function(status, body) {
    var url;
    url = this.baseUrl + this.route;
    this.currentRouter.addRoute(url, function() {
      return {
        status: status,
        body: body
      };
    });
    return this;
  };

  Zock.prototype.open = function(method, url) {
    var res;
    return res = routers[method.toLowerCase()].match(url);
  };

  Zock.prototype.send = function() {
    var request;
    request = new FakeXMLHttpRequest();
    return request.respond();
  };

  Zock.prototype.XMLHttpRequest = function() {
    return this;
  };

  return Zock;

})();

if (typeof window !== 'undefined') {
  window.Zock = Zock;
}

module.exports = Zock;



},{"./components/fake-xml-http-request/fake_xml_http_request":2,"routes":3}],2:[function(require,module,exports){
(function(undefined){
/**
 * Minimal Event interface implementation
 *
 * Original implementation by Sven Fuchs: https://gist.github.com/995028
 * Modifications and tests by Christian Johansen.
 *
 * @author Sven Fuchs (svenfuchs@artweb-design.de)
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2011 Sven Fuchs, Christian Johansen
 */

var _Event = function Event(type, bubbles, cancelable, target) {
  this.type = type;
  this.bubbles = bubbles;
  this.cancelable = cancelable;
  this.target = target;
};

_Event.prototype = {
  stopPropagation: function () {},
  preventDefault: function () {
    this.defaultPrevented = true;
  }
};

/*
  Used to set the statusText property of an xhr object
*/
var httpStatusCodes = {
  100: "Continue",
  101: "Switching Protocols",
  200: "OK",
  201: "Created",
  202: "Accepted",
  203: "Non-Authoritative Information",
  204: "No Content",
  205: "Reset Content",
  206: "Partial Content",
  300: "Multiple Choice",
  301: "Moved Permanently",
  302: "Found",
  303: "See Other",
  304: "Not Modified",
  305: "Use Proxy",
  307: "Temporary Redirect",
  400: "Bad Request",
  401: "Unauthorized",
  402: "Payment Required",
  403: "Forbidden",
  404: "Not Found",
  405: "Method Not Allowed",
  406: "Not Acceptable",
  407: "Proxy Authentication Required",
  408: "Request Timeout",
  409: "Conflict",
  410: "Gone",
  411: "Length Required",
  412: "Precondition Failed",
  413: "Request Entity Too Large",
  414: "Request-URI Too Long",
  415: "Unsupported Media Type",
  416: "Requested Range Not Satisfiable",
  417: "Expectation Failed",
  422: "Unprocessable Entity",
  500: "Internal Server Error",
  501: "Not Implemented",
  502: "Bad Gateway",
  503: "Service Unavailable",
  504: "Gateway Timeout",
  505: "HTTP Version Not Supported"
};


/*
  Cross-browser XML parsing. Used to turn
  XML responses into Document objects
  Borrowed from JSpec
*/
function parseXML(text) {
  var xmlDoc;

  if (typeof DOMParser != "undefined") {
    var parser = new DOMParser();
    xmlDoc = parser.parseFromString(text, "text/xml");
  } else {
    xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
    xmlDoc.async = "false";
    xmlDoc.loadXML(text);
  }

  return xmlDoc;
}

/*
  Without mocking, the native XMLHttpRequest object will throw
  an error when attempting to set these headers. We match this behavior.
*/
var unsafeHeaders = {
  "Accept-Charset": true,
  "Accept-Encoding": true,
  "Connection": true,
  "Content-Length": true,
  "Cookie": true,
  "Cookie2": true,
  "Content-Transfer-Encoding": true,
  "Date": true,
  "Expect": true,
  "Host": true,
  "Keep-Alive": true,
  "Referer": true,
  "TE": true,
  "Trailer": true,
  "Transfer-Encoding": true,
  "Upgrade": true,
  "User-Agent": true,
  "Via": true
};

/*
  Adds an "event" onto the fake xhr object
  that just calls the same-named method. This is
  in case a library adds callbacks for these events.
*/
function _addEventListener(eventName, xhr){
  xhr.addEventListener(eventName, function (event) {
    var listener = xhr["on" + eventName];

    if (listener && typeof listener == "function") {
      listener(event);
    }
  });
}

/*
  Constructor for a fake window.XMLHttpRequest
*/
function FakeXMLHttpRequest() {
  this.readyState = FakeXMLHttpRequest.UNSENT;
  this.requestHeaders = {};
  this.requestBody = null;
  this.status = 0;
  this.statusText = "";

  this._eventListeners = {};
  var events = ["loadstart", "load", "abort", "loadend"];
  for (var i = events.length - 1; i >= 0; i--) {
    _addEventListener(events[i], this);
  }
}


// These status codes are available on the native XMLHttpRequest
// object, so we match that here in case a library is relying on them.
FakeXMLHttpRequest.UNSENT = 0;
FakeXMLHttpRequest.OPENED = 1;
FakeXMLHttpRequest.HEADERS_RECEIVED = 2;
FakeXMLHttpRequest.LOADING = 3;
FakeXMLHttpRequest.DONE = 4;

FakeXMLHttpRequest.prototype = {
  UNSENT: 0,
  OPENED: 1,
  HEADERS_RECEIVED: 2,
  LOADING: 3,
  DONE: 4,
  async: true,

  /*
    Duplicates the behavior of native XMLHttpRequest's open function
  */
  open: function open(method, url, async, username, password) {
    this.method = method;
    this.url = url;
    this.async = typeof async == "boolean" ? async : true;
    this.username = username;
    this.password = password;
    this.responseText = null;
    this.responseXML = null;
    this.requestHeaders = {};
    this.sendFlag = false;
    this._readyStateChange(FakeXMLHttpRequest.OPENED);
  },

  /*
    Duplicates the behavior of native XMLHttpRequest's addEventListener function
  */
  addEventListener: function addEventListener(event, listener) {
    this._eventListeners[event] = this._eventListeners[event] || [];
    this._eventListeners[event].push(listener);
  },

  /*
    Duplicates the behavior of native XMLHttpRequest's removeEventListener function
  */
  removeEventListener: function removeEventListener(event, listener) {
    var listeners = this._eventListeners[event] || [];

    for (var i = 0, l = listeners.length; i < l; ++i) {
      if (listeners[i] == listener) {
        return listeners.splice(i, 1);
      }
    }
  },

  /*
    Duplicates the behavior of native XMLHttpRequest's dispatchEvent function
  */
  dispatchEvent: function dispatchEvent(event) {
    var type = event.type;
    var listeners = this._eventListeners[type] || [];

    for (var i = 0; i < listeners.length; i++) {
      if (typeof listeners[i] == "function") {
        listeners[i].call(this, event);
      } else {
        listeners[i].handleEvent(event);
      }
    }

    return !!event.defaultPrevented;
  },

  /*
    Duplicates the behavior of native XMLHttpRequest's setRequestHeader function
  */
  setRequestHeader: function setRequestHeader(header, value) {
    verifyState(this);

    if (unsafeHeaders[header] || /^(Sec-|Proxy-)/.test(header)) {
      throw new Error("Refused to set unsafe header \"" + header + "\"");
    }

    if (this.requestHeaders[header]) {
      this.requestHeaders[header] += "," + value;
    } else {
      this.requestHeaders[header] = value;
    }
  },

  /*
    Duplicates the behavior of native XMLHttpRequest's send function
  */
  send: function send(data) {
    verifyState(this);

    if (!/^(get|head)$/i.test(this.method)) {
      if (this.requestHeaders["Content-Type"]) {
        var value = this.requestHeaders["Content-Type"].split(";");
        this.requestHeaders["Content-Type"] = value[0] + ";charset=utf-8";
      } else {
        this.requestHeaders["Content-Type"] = "text/plain;charset=utf-8";
      }

      this.requestBody = data;
    }

    this.errorFlag = false;
    this.sendFlag = this.async;
    this._readyStateChange(FakeXMLHttpRequest.OPENED);

    if (typeof this.onSend == "function") {
      this.onSend(this);
    }

    this.dispatchEvent(new _Event("loadstart", false, false, this));
  },

  /*
    Duplicates the behavior of native XMLHttpRequest's abort function
  */
  abort: function abort() {
    this.aborted = true;
    this.responseText = null;
    this.errorFlag = true;
    this.requestHeaders = {};

    if (this.readyState > FakeXMLHttpRequest.UNSENT && this.sendFlag) {
      this._readyStateChange(FakeXMLHttpRequest.DONE);
      this.sendFlag = false;
    }

    this.readyState = FakeXMLHttpRequest.UNSENT;

    this.dispatchEvent(new _Event("abort", false, false, this));
    if (typeof this.onerror === "function") {
        this.onerror();
    }
  },

  /*
    Duplicates the behavior of native XMLHttpRequest's getResponseHeader function
  */
  getResponseHeader: function getResponseHeader(header) {
    if (this.readyState < FakeXMLHttpRequest.HEADERS_RECEIVED) {
      return null;
    }

    if (/^Set-Cookie2?$/i.test(header)) {
      return null;
    }

    header = header.toLowerCase();

    for (var h in this.responseHeaders) {
      if (h.toLowerCase() == header) {
        return this.responseHeaders[h];
      }
    }

    return null;
  },

  /*
    Duplicates the behavior of native XMLHttpRequest's getAllResponseHeaders function
  */
  getAllResponseHeaders: function getAllResponseHeaders() {
    if (this.readyState < FakeXMLHttpRequest.HEADERS_RECEIVED) {
      return "";
    }

    var headers = "";

    for (var header in this.responseHeaders) {
      if (this.responseHeaders.hasOwnProperty(header) && !/^Set-Cookie2?$/i.test(header)) {
        headers += header + ": " + this.responseHeaders[header] + "\r\n";
      }
    }

    return headers;
  },

  /*
    Places a FakeXMLHttpRequest object into the passed
    state.
  */
  _readyStateChange: function _readyStateChange(state) {
    this.readyState = state;

    if (typeof this.onreadystatechange == "function") {
      this.onreadystatechange();
    }

    this.dispatchEvent(new _Event("readystatechange"));

    if (this.readyState == FakeXMLHttpRequest.DONE) {
      this.dispatchEvent(new _Event("load", false, false, this));
      this.dispatchEvent(new _Event("loadend", false, false, this));
    }
  },


  /*
    Sets the FakeXMLHttpRequest object's response headers and
    places the object into readyState 2
  */
  _setResponseHeaders: function _setResponseHeaders(headers) {
    this.responseHeaders = {};

    for (var header in headers) {
      if (headers.hasOwnProperty(header)) {
          this.responseHeaders[header] = headers[header];
      }
    }

    if (this.async) {
      this._readyStateChange(FakeXMLHttpRequest.HEADERS_RECEIVED);
    } else {
      this.readyState = FakeXMLHttpRequest.HEADERS_RECEIVED;
    }
  },



  /*
    Sets the FakeXMLHttpRequest object's response body and
    if body text is XML, sets responseXML to parsed document
    object
  */
  _setResponseBody: function _setResponseBody(body) {
    verifyRequestSent(this);
    verifyHeadersReceived(this);
    verifyResponseBodyType(body);

    var chunkSize = this.chunkSize || 10;
    var index = 0;
    this.responseText = "";

    do {
      if (this.async) {
        this._readyStateChange(FakeXMLHttpRequest.LOADING);
      }

      this.responseText += body.substring(index, index + chunkSize);
      index += chunkSize;
    } while (index < body.length);

    var type = this.getResponseHeader("Content-Type");

    if (this.responseText && (!type || /(text\/xml)|(application\/xml)|(\+xml)/.test(type))) {
      try {
        this.responseXML = parseXML(this.responseText);
      } catch (e) {
        // Unable to parse XML - no biggie
      }
    }

    if (this.async) {
      this._readyStateChange(FakeXMLHttpRequest.DONE);
    } else {
      this.readyState = FakeXMLHttpRequest.DONE;
    }
  },

  /*
    Forces a response on to the FakeXMLHttpRequest object.

    This is the public API for faking responses. This function
    takes a number status, headers object, and string body:

    ```
    xhr.respond(404, {Content-Type: 'text/plain'}, "Sorry. This object was not found.")

    ```
  */
  respond: function respond(status, headers, body) {
    this._setResponseHeaders(headers || {});
    this.status = typeof status == "number" ? status : 200;
    this.statusText = httpStatusCodes[this.status];
    this._setResponseBody(body || "");
    if (typeof this.onload === "function"){
      this.onload();
    }
  }
};

function verifyState(xhr) {
  if (xhr.readyState !== FakeXMLHttpRequest.OPENED) {
    throw new Error("INVALID_STATE_ERR");
  }

  if (xhr.sendFlag) {
    throw new Error("INVALID_STATE_ERR");
  }
}


function verifyRequestSent(xhr) {
    if (xhr.readyState == FakeXMLHttpRequest.DONE) {
        throw new Error("Request done");
    }
}

function verifyHeadersReceived(xhr) {
    if (xhr.async && xhr.readyState != FakeXMLHttpRequest.HEADERS_RECEIVED) {
        throw new Error("No headers received");
    }
}

function verifyResponseBodyType(body) {
    if (typeof body != "string") {
        var error = new Error("Attempted to respond to fake XMLHttpRequest with " +
                             body + ", which is not a string.");
        error.name = "InvalidBodyException";
        throw error;
    }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = FakeXMLHttpRequest;
} else if (typeof define === 'function' && define.amd) {
  define(function() { return FakeXMLHttpRequest; });
} else if (typeof window !== 'undefined') {
  window.FakeXMLHttpRequest = FakeXMLHttpRequest;
} else if (this) {
  this.FakeXMLHttpRequest = FakeXMLHttpRequest;
}
})();

},{}],3:[function(require,module,exports){
(function (global){
!function(e){if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.routes=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){

var localRoutes = [];


/**
 * Convert path to route object
 *
 * A string or RegExp should be passed,
 * will return { re, src, keys} obj
 *
 * @param  {String / RegExp} path
 * @return {Object}
 */

var Route = function(path){
  //using 'new' is optional

  var src, re, keys = [];

  if(path instanceof RegExp){
    re = path;
    src = path.toString();
  }else{
    re = pathToRegExp(path, keys);
    src = path;
  }

  return {
  	 re: re,
  	 src: path.toString(),
  	 keys: keys
  }
};

/**
 * Normalize the given path string,
 * returning a regular expression.
 *
 * An empty array should be passed,
 * which will contain the placeholder
 * key names. For example "/user/:id" will
 * then contain ["id"].
 *
 * @param  {String} path
 * @param  {Array} keys
 * @return {RegExp}
 */
var pathToRegExp = function (path, keys) {
	path = path
		.concat('/?')
		.replace(/\/\(/g, '(?:/')
		.replace(/(\/)?(\.)?:(\w+)(?:(\(.*?\)))?(\?)?|\*/g, function(_, slash, format, key, capture, optional){
			if (_ === "*"){
				keys.push(undefined);
				return _;
			}

			keys.push(key);
			slash = slash || '';
			return ''
				+ (optional ? '' : slash)
				+ '(?:'
				+ (optional ? slash : '')
				+ (format || '') + (capture || '([^/]+?)') + ')'
				+ (optional || '');
		})
		.replace(/([\/.])/g, '\\$1')
		.replace(/\*/g, '(.*)');
	return new RegExp('^' + path + '$', 'i');
};

/**
 * Attempt to match the given request to
 * one of the routes. When successful
 * a  {fn, params, splats} obj is returned
 *
 * @param  {Array} routes
 * @param  {String} uri
 * @return {Object}
 */
var match = function (routes, uri, startAt) {
	var captures, i = startAt || 0;

	for (var len = routes.length; i < len; ++i) {
		var route = routes[i],
		    re = route.re,
		    keys = route.keys,
		    splats = [],
		    params = {};

		if (captures = uri.match(re)) {
			for (var j = 1, len = captures.length; j < len; ++j) {
				var key = keys[j-1],
					val = typeof captures[j] === 'string'
						? unescape(captures[j])
						: captures[j];
				if (key) {
					params[key] = val;
				} else {
					splats.push(val);
				}
			}
			return {
				params: params,
				splats: splats,
				route: route.src,
				next: i + 1
			};
		}
	}
};

/**
 * Default "normal" router constructor.
 * accepts path, fn tuples via addRoute
 * returns {fn, params, splats, route}
 *  via match
 *
 * @return {Object}
 */

var Router = function(){
  //using 'new' is optional
  return {
    routes: [],
    routeMap : {},
    addRoute: function(path, fn){
      if (!path) throw new Error(' route requires a path');
      if (!fn) throw new Error(' route ' + path.toString() + ' requires a callback');

      var route = Route(path);
      route.fn = fn;

      this.routes.push(route);
      this.routeMap[path] = fn;
    },

    match: function(pathname, startAt){
      var route = match(this.routes, pathname, startAt);
      if(route){
        route.fn = this.routeMap[route.route];
        route.next = this.match.bind(this, pathname, route.next)
      }
      return route;
    }
  }
};

Router.Route = Route
Router.pathToRegExp = pathToRegExp
Router.match = match
// back compat
Router.Router = Router

module.exports = Router

},{}]},{},[1])
(1)
});
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL3pvbGkvY2xheS96b2NrL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvaG9tZS96b2xpL2NsYXkvem9jay96b2NrLmNvZmZlZSIsIi9ob21lL3pvbGkvY2xheS96b2NrL2NvbXBvbmVudHMvZmFrZS14bWwtaHR0cC1yZXF1ZXN0L2Zha2VfeG1sX2h0dHBfcmVxdWVzdC5qcyIsIi9ob21lL3pvbGkvY2xheS96b2NrL25vZGVfbW9kdWxlcy9yb3V0ZXMvZGlzdC9yb3V0ZXMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQSxJQUFBLHlDQUFBO0VBQUEsa0ZBQUE7O0FBQUEsa0JBQUEsR0FDRSxPQUFBLENBQVEsMERBQVIsQ0FERixDQUFBOztBQUFBLE1BR0EsR0FBUyxPQUFBLENBQVEsUUFBUixDQUhULENBQUE7O0FBQUEsT0FLQSxHQUNFO0FBQUEsRUFBQSxHQUFBLEVBQUssTUFBQSxDQUFBLENBQUw7Q0FORixDQUFBOztBQUFBO0FBU2UsRUFBQSxjQUFFLE9BQUYsR0FBQTtBQUNYLElBRFksSUFBQyxDQUFBLFVBQUEsT0FDYixDQUFBO0FBQUEsMkRBQUEsQ0FBQTtBQUFBLFdBQU8sSUFBUCxDQURXO0VBQUEsQ0FBYjs7QUFBQSxpQkFHQSxHQUFBLEdBQUssU0FBRSxLQUFGLEdBQUE7QUFDSCxJQURJLElBQUMsQ0FBQSxRQUFBLEtBQ0wsQ0FBQTtBQUFBLElBQUEsSUFBQyxDQUFBLGFBQUQsR0FBaUIsT0FBTyxDQUFDLEdBQXpCLENBQUE7QUFDQSxXQUFPLElBQVAsQ0FGRztFQUFBLENBSEwsQ0FBQTs7QUFBQSxpQkFPQSxLQUFBLEdBQU8sU0FBQyxNQUFELEVBQVMsSUFBVCxHQUFBO0FBQ0wsUUFBQSxHQUFBO0FBQUEsSUFBQSxHQUFBLEdBQU0sSUFBQyxDQUFBLE9BQUQsR0FBVyxJQUFDLENBQUEsS0FBbEIsQ0FBQTtBQUFBLElBRUEsSUFBQyxDQUFBLGFBQWEsQ0FBQyxRQUFmLENBQXdCLEdBQXhCLEVBQTZCLFNBQUEsR0FBQTtBQUMzQixhQUFPO0FBQUEsUUFDTCxNQUFBLEVBQVEsTUFESDtBQUFBLFFBRUwsSUFBQSxFQUFNLElBRkQ7T0FBUCxDQUQyQjtJQUFBLENBQTdCLENBRkEsQ0FBQTtBQVFBLFdBQU8sSUFBUCxDQVRLO0VBQUEsQ0FQUCxDQUFBOztBQUFBLGlCQWtCQSxJQUFBLEdBQU0sU0FBQyxNQUFELEVBQVMsR0FBVCxHQUFBO0FBQ0osUUFBQSxHQUFBO1dBQUEsR0FBQSxHQUFNLE9BQVEsQ0FBQSxNQUFNLENBQUMsV0FBUCxDQUFBLENBQUEsQ0FBcUIsQ0FBQyxLQUE5QixDQUFvQyxHQUFwQyxFQURGO0VBQUEsQ0FsQk4sQ0FBQTs7QUFBQSxpQkFxQkEsSUFBQSxHQUFNLFNBQUEsR0FBQTtBQUNKLFFBQUEsT0FBQTtBQUFBLElBQUEsT0FBQSxHQUFjLElBQUEsa0JBQUEsQ0FBQSxDQUFkLENBQUE7V0FDQSxPQUFPLENBQUMsT0FBUixDQUFBLEVBRkk7RUFBQSxDQXJCTixDQUFBOztBQUFBLGlCQXlCQSxjQUFBLEdBQWdCLFNBQUEsR0FBQTtBQUNkLFdBQU8sSUFBUCxDQURjO0VBQUEsQ0F6QmhCLENBQUE7O2NBQUE7O0lBVEYsQ0FBQTs7QUFzQ0EsSUFBRyxNQUFBLENBQUEsTUFBQSxLQUFpQixXQUFwQjtBQUNFLEVBQUEsTUFBTSxDQUFDLElBQVAsR0FBYyxJQUFkLENBREY7Q0F0Q0E7O0FBQUEsTUF5Q00sQ0FBQyxPQUFQLEdBQWlCLElBekNqQixDQUFBOzs7OztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hlQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiRmFrZVhNTEh0dHBSZXF1ZXN0ID1cbiAgcmVxdWlyZSAnLi9jb21wb25lbnRzL2Zha2UteG1sLWh0dHAtcmVxdWVzdC9mYWtlX3htbF9odHRwX3JlcXVlc3QnXG5cblJvdXRlciA9IHJlcXVpcmUoJ3JvdXRlcycpXG5cbnJvdXRlcnMgPVxuICBnZXQ6IFJvdXRlcigpXG5cbmNsYXNzIFpvY2tcbiAgY29uc3RydWN0b3I6IChAYmFzZVVybCkgLT5cbiAgICByZXR1cm4gdGhpc1xuXG4gIGdldDogKEByb3V0ZSkgLT5cbiAgICBAY3VycmVudFJvdXRlciA9IHJvdXRlcnMuZ2V0XG4gICAgcmV0dXJuIHRoaXNcblxuICByZXBseTogKHN0YXR1cywgYm9keSkgLT5cbiAgICB1cmwgPSBAYmFzZVVybCArIEByb3V0ZVxuXG4gICAgQGN1cnJlbnRSb3V0ZXIuYWRkUm91dGUgdXJsLCAtPlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc3RhdHVzOiBzdGF0dXNcbiAgICAgICAgYm9keTogYm9keVxuICAgICAgfVxuXG4gICAgcmV0dXJuIHRoaXNcblxuICBvcGVuOiAobWV0aG9kLCB1cmwpIC0+XG4gICAgcmVzID0gcm91dGVyc1ttZXRob2QudG9Mb3dlckNhc2UoKV0ubWF0Y2ggdXJsXG5cbiAgc2VuZDogKCkgLT5cbiAgICByZXF1ZXN0ID0gbmV3IEZha2VYTUxIdHRwUmVxdWVzdCgpXG4gICAgcmVxdWVzdC5yZXNwb25kKClcblxuICBYTUxIdHRwUmVxdWVzdDogPT5cbiAgICByZXR1cm4gdGhpc1xuXG5cbmlmIHR5cGVvZiB3aW5kb3cgIT0gJ3VuZGVmaW5lZCdcbiAgd2luZG93LlpvY2sgPSBab2NrXG5cbm1vZHVsZS5leHBvcnRzID0gWm9ja1xuIiwiKGZ1bmN0aW9uKHVuZGVmaW5lZCl7XG4vKipcbiAqIE1pbmltYWwgRXZlbnQgaW50ZXJmYWNlIGltcGxlbWVudGF0aW9uXG4gKlxuICogT3JpZ2luYWwgaW1wbGVtZW50YXRpb24gYnkgU3ZlbiBGdWNoczogaHR0cHM6Ly9naXN0LmdpdGh1Yi5jb20vOTk1MDI4XG4gKiBNb2RpZmljYXRpb25zIGFuZCB0ZXN0cyBieSBDaHJpc3RpYW4gSm9oYW5zZW4uXG4gKlxuICogQGF1dGhvciBTdmVuIEZ1Y2hzIChzdmVuZnVjaHNAYXJ0d2ViLWRlc2lnbi5kZSlcbiAqIEBhdXRob3IgQ2hyaXN0aWFuIEpvaGFuc2VuIChjaHJpc3RpYW5AY2pvaGFuc2VuLm5vKVxuICogQGxpY2Vuc2UgQlNEXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDExIFN2ZW4gRnVjaHMsIENocmlzdGlhbiBKb2hhbnNlblxuICovXG5cbnZhciBfRXZlbnQgPSBmdW5jdGlvbiBFdmVudCh0eXBlLCBidWJibGVzLCBjYW5jZWxhYmxlLCB0YXJnZXQpIHtcbiAgdGhpcy50eXBlID0gdHlwZTtcbiAgdGhpcy5idWJibGVzID0gYnViYmxlcztcbiAgdGhpcy5jYW5jZWxhYmxlID0gY2FuY2VsYWJsZTtcbiAgdGhpcy50YXJnZXQgPSB0YXJnZXQ7XG59O1xuXG5fRXZlbnQucHJvdG90eXBlID0ge1xuICBzdG9wUHJvcGFnYXRpb246IGZ1bmN0aW9uICgpIHt9LFxuICBwcmV2ZW50RGVmYXVsdDogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZGVmYXVsdFByZXZlbnRlZCA9IHRydWU7XG4gIH1cbn07XG5cbi8qXG4gIFVzZWQgdG8gc2V0IHRoZSBzdGF0dXNUZXh0IHByb3BlcnR5IG9mIGFuIHhociBvYmplY3RcbiovXG52YXIgaHR0cFN0YXR1c0NvZGVzID0ge1xuICAxMDA6IFwiQ29udGludWVcIixcbiAgMTAxOiBcIlN3aXRjaGluZyBQcm90b2NvbHNcIixcbiAgMjAwOiBcIk9LXCIsXG4gIDIwMTogXCJDcmVhdGVkXCIsXG4gIDIwMjogXCJBY2NlcHRlZFwiLFxuICAyMDM6IFwiTm9uLUF1dGhvcml0YXRpdmUgSW5mb3JtYXRpb25cIixcbiAgMjA0OiBcIk5vIENvbnRlbnRcIixcbiAgMjA1OiBcIlJlc2V0IENvbnRlbnRcIixcbiAgMjA2OiBcIlBhcnRpYWwgQ29udGVudFwiLFxuICAzMDA6IFwiTXVsdGlwbGUgQ2hvaWNlXCIsXG4gIDMwMTogXCJNb3ZlZCBQZXJtYW5lbnRseVwiLFxuICAzMDI6IFwiRm91bmRcIixcbiAgMzAzOiBcIlNlZSBPdGhlclwiLFxuICAzMDQ6IFwiTm90IE1vZGlmaWVkXCIsXG4gIDMwNTogXCJVc2UgUHJveHlcIixcbiAgMzA3OiBcIlRlbXBvcmFyeSBSZWRpcmVjdFwiLFxuICA0MDA6IFwiQmFkIFJlcXVlc3RcIixcbiAgNDAxOiBcIlVuYXV0aG9yaXplZFwiLFxuICA0MDI6IFwiUGF5bWVudCBSZXF1aXJlZFwiLFxuICA0MDM6IFwiRm9yYmlkZGVuXCIsXG4gIDQwNDogXCJOb3QgRm91bmRcIixcbiAgNDA1OiBcIk1ldGhvZCBOb3QgQWxsb3dlZFwiLFxuICA0MDY6IFwiTm90IEFjY2VwdGFibGVcIixcbiAgNDA3OiBcIlByb3h5IEF1dGhlbnRpY2F0aW9uIFJlcXVpcmVkXCIsXG4gIDQwODogXCJSZXF1ZXN0IFRpbWVvdXRcIixcbiAgNDA5OiBcIkNvbmZsaWN0XCIsXG4gIDQxMDogXCJHb25lXCIsXG4gIDQxMTogXCJMZW5ndGggUmVxdWlyZWRcIixcbiAgNDEyOiBcIlByZWNvbmRpdGlvbiBGYWlsZWRcIixcbiAgNDEzOiBcIlJlcXVlc3QgRW50aXR5IFRvbyBMYXJnZVwiLFxuICA0MTQ6IFwiUmVxdWVzdC1VUkkgVG9vIExvbmdcIixcbiAgNDE1OiBcIlVuc3VwcG9ydGVkIE1lZGlhIFR5cGVcIixcbiAgNDE2OiBcIlJlcXVlc3RlZCBSYW5nZSBOb3QgU2F0aXNmaWFibGVcIixcbiAgNDE3OiBcIkV4cGVjdGF0aW9uIEZhaWxlZFwiLFxuICA0MjI6IFwiVW5wcm9jZXNzYWJsZSBFbnRpdHlcIixcbiAgNTAwOiBcIkludGVybmFsIFNlcnZlciBFcnJvclwiLFxuICA1MDE6IFwiTm90IEltcGxlbWVudGVkXCIsXG4gIDUwMjogXCJCYWQgR2F0ZXdheVwiLFxuICA1MDM6IFwiU2VydmljZSBVbmF2YWlsYWJsZVwiLFxuICA1MDQ6IFwiR2F0ZXdheSBUaW1lb3V0XCIsXG4gIDUwNTogXCJIVFRQIFZlcnNpb24gTm90IFN1cHBvcnRlZFwiXG59O1xuXG5cbi8qXG4gIENyb3NzLWJyb3dzZXIgWE1MIHBhcnNpbmcuIFVzZWQgdG8gdHVyblxuICBYTUwgcmVzcG9uc2VzIGludG8gRG9jdW1lbnQgb2JqZWN0c1xuICBCb3Jyb3dlZCBmcm9tIEpTcGVjXG4qL1xuZnVuY3Rpb24gcGFyc2VYTUwodGV4dCkge1xuICB2YXIgeG1sRG9jO1xuXG4gIGlmICh0eXBlb2YgRE9NUGFyc2VyICE9IFwidW5kZWZpbmVkXCIpIHtcbiAgICB2YXIgcGFyc2VyID0gbmV3IERPTVBhcnNlcigpO1xuICAgIHhtbERvYyA9IHBhcnNlci5wYXJzZUZyb21TdHJpbmcodGV4dCwgXCJ0ZXh0L3htbFwiKTtcbiAgfSBlbHNlIHtcbiAgICB4bWxEb2MgPSBuZXcgQWN0aXZlWE9iamVjdChcIk1pY3Jvc29mdC5YTUxET01cIik7XG4gICAgeG1sRG9jLmFzeW5jID0gXCJmYWxzZVwiO1xuICAgIHhtbERvYy5sb2FkWE1MKHRleHQpO1xuICB9XG5cbiAgcmV0dXJuIHhtbERvYztcbn1cblxuLypcbiAgV2l0aG91dCBtb2NraW5nLCB0aGUgbmF0aXZlIFhNTEh0dHBSZXF1ZXN0IG9iamVjdCB3aWxsIHRocm93XG4gIGFuIGVycm9yIHdoZW4gYXR0ZW1wdGluZyB0byBzZXQgdGhlc2UgaGVhZGVycy4gV2UgbWF0Y2ggdGhpcyBiZWhhdmlvci5cbiovXG52YXIgdW5zYWZlSGVhZGVycyA9IHtcbiAgXCJBY2NlcHQtQ2hhcnNldFwiOiB0cnVlLFxuICBcIkFjY2VwdC1FbmNvZGluZ1wiOiB0cnVlLFxuICBcIkNvbm5lY3Rpb25cIjogdHJ1ZSxcbiAgXCJDb250ZW50LUxlbmd0aFwiOiB0cnVlLFxuICBcIkNvb2tpZVwiOiB0cnVlLFxuICBcIkNvb2tpZTJcIjogdHJ1ZSxcbiAgXCJDb250ZW50LVRyYW5zZmVyLUVuY29kaW5nXCI6IHRydWUsXG4gIFwiRGF0ZVwiOiB0cnVlLFxuICBcIkV4cGVjdFwiOiB0cnVlLFxuICBcIkhvc3RcIjogdHJ1ZSxcbiAgXCJLZWVwLUFsaXZlXCI6IHRydWUsXG4gIFwiUmVmZXJlclwiOiB0cnVlLFxuICBcIlRFXCI6IHRydWUsXG4gIFwiVHJhaWxlclwiOiB0cnVlLFxuICBcIlRyYW5zZmVyLUVuY29kaW5nXCI6IHRydWUsXG4gIFwiVXBncmFkZVwiOiB0cnVlLFxuICBcIlVzZXItQWdlbnRcIjogdHJ1ZSxcbiAgXCJWaWFcIjogdHJ1ZVxufTtcblxuLypcbiAgQWRkcyBhbiBcImV2ZW50XCIgb250byB0aGUgZmFrZSB4aHIgb2JqZWN0XG4gIHRoYXQganVzdCBjYWxscyB0aGUgc2FtZS1uYW1lZCBtZXRob2QuIFRoaXMgaXNcbiAgaW4gY2FzZSBhIGxpYnJhcnkgYWRkcyBjYWxsYmFja3MgZm9yIHRoZXNlIGV2ZW50cy5cbiovXG5mdW5jdGlvbiBfYWRkRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsIHhocil7XG4gIHhoci5hZGRFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgdmFyIGxpc3RlbmVyID0geGhyW1wib25cIiArIGV2ZW50TmFtZV07XG5cbiAgICBpZiAobGlzdGVuZXIgJiYgdHlwZW9mIGxpc3RlbmVyID09IFwiZnVuY3Rpb25cIikge1xuICAgICAgbGlzdGVuZXIoZXZlbnQpO1xuICAgIH1cbiAgfSk7XG59XG5cbi8qXG4gIENvbnN0cnVjdG9yIGZvciBhIGZha2Ugd2luZG93LlhNTEh0dHBSZXF1ZXN0XG4qL1xuZnVuY3Rpb24gRmFrZVhNTEh0dHBSZXF1ZXN0KCkge1xuICB0aGlzLnJlYWR5U3RhdGUgPSBGYWtlWE1MSHR0cFJlcXVlc3QuVU5TRU5UO1xuICB0aGlzLnJlcXVlc3RIZWFkZXJzID0ge307XG4gIHRoaXMucmVxdWVzdEJvZHkgPSBudWxsO1xuICB0aGlzLnN0YXR1cyA9IDA7XG4gIHRoaXMuc3RhdHVzVGV4dCA9IFwiXCI7XG5cbiAgdGhpcy5fZXZlbnRMaXN0ZW5lcnMgPSB7fTtcbiAgdmFyIGV2ZW50cyA9IFtcImxvYWRzdGFydFwiLCBcImxvYWRcIiwgXCJhYm9ydFwiLCBcImxvYWRlbmRcIl07XG4gIGZvciAodmFyIGkgPSBldmVudHMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICBfYWRkRXZlbnRMaXN0ZW5lcihldmVudHNbaV0sIHRoaXMpO1xuICB9XG59XG5cblxuLy8gVGhlc2Ugc3RhdHVzIGNvZGVzIGFyZSBhdmFpbGFibGUgb24gdGhlIG5hdGl2ZSBYTUxIdHRwUmVxdWVzdFxuLy8gb2JqZWN0LCBzbyB3ZSBtYXRjaCB0aGF0IGhlcmUgaW4gY2FzZSBhIGxpYnJhcnkgaXMgcmVseWluZyBvbiB0aGVtLlxuRmFrZVhNTEh0dHBSZXF1ZXN0LlVOU0VOVCA9IDA7XG5GYWtlWE1MSHR0cFJlcXVlc3QuT1BFTkVEID0gMTtcbkZha2VYTUxIdHRwUmVxdWVzdC5IRUFERVJTX1JFQ0VJVkVEID0gMjtcbkZha2VYTUxIdHRwUmVxdWVzdC5MT0FESU5HID0gMztcbkZha2VYTUxIdHRwUmVxdWVzdC5ET05FID0gNDtcblxuRmFrZVhNTEh0dHBSZXF1ZXN0LnByb3RvdHlwZSA9IHtcbiAgVU5TRU5UOiAwLFxuICBPUEVORUQ6IDEsXG4gIEhFQURFUlNfUkVDRUlWRUQ6IDIsXG4gIExPQURJTkc6IDMsXG4gIERPTkU6IDQsXG4gIGFzeW5jOiB0cnVlLFxuXG4gIC8qXG4gICAgRHVwbGljYXRlcyB0aGUgYmVoYXZpb3Igb2YgbmF0aXZlIFhNTEh0dHBSZXF1ZXN0J3Mgb3BlbiBmdW5jdGlvblxuICAqL1xuICBvcGVuOiBmdW5jdGlvbiBvcGVuKG1ldGhvZCwgdXJsLCBhc3luYywgdXNlcm5hbWUsIHBhc3N3b3JkKSB7XG4gICAgdGhpcy5tZXRob2QgPSBtZXRob2Q7XG4gICAgdGhpcy51cmwgPSB1cmw7XG4gICAgdGhpcy5hc3luYyA9IHR5cGVvZiBhc3luYyA9PSBcImJvb2xlYW5cIiA/IGFzeW5jIDogdHJ1ZTtcbiAgICB0aGlzLnVzZXJuYW1lID0gdXNlcm5hbWU7XG4gICAgdGhpcy5wYXNzd29yZCA9IHBhc3N3b3JkO1xuICAgIHRoaXMucmVzcG9uc2VUZXh0ID0gbnVsbDtcbiAgICB0aGlzLnJlc3BvbnNlWE1MID0gbnVsbDtcbiAgICB0aGlzLnJlcXVlc3RIZWFkZXJzID0ge307XG4gICAgdGhpcy5zZW5kRmxhZyA9IGZhbHNlO1xuICAgIHRoaXMuX3JlYWR5U3RhdGVDaGFuZ2UoRmFrZVhNTEh0dHBSZXF1ZXN0Lk9QRU5FRCk7XG4gIH0sXG5cbiAgLypcbiAgICBEdXBsaWNhdGVzIHRoZSBiZWhhdmlvciBvZiBuYXRpdmUgWE1MSHR0cFJlcXVlc3QncyBhZGRFdmVudExpc3RlbmVyIGZ1bmN0aW9uXG4gICovXG4gIGFkZEV2ZW50TGlzdGVuZXI6IGZ1bmN0aW9uIGFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIGxpc3RlbmVyKSB7XG4gICAgdGhpcy5fZXZlbnRMaXN0ZW5lcnNbZXZlbnRdID0gdGhpcy5fZXZlbnRMaXN0ZW5lcnNbZXZlbnRdIHx8IFtdO1xuICAgIHRoaXMuX2V2ZW50TGlzdGVuZXJzW2V2ZW50XS5wdXNoKGxpc3RlbmVyKTtcbiAgfSxcblxuICAvKlxuICAgIER1cGxpY2F0ZXMgdGhlIGJlaGF2aW9yIG9mIG5hdGl2ZSBYTUxIdHRwUmVxdWVzdCdzIHJlbW92ZUV2ZW50TGlzdGVuZXIgZnVuY3Rpb25cbiAgKi9cbiAgcmVtb3ZlRXZlbnRMaXN0ZW5lcjogZnVuY3Rpb24gcmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudCwgbGlzdGVuZXIpIHtcbiAgICB2YXIgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRMaXN0ZW5lcnNbZXZlbnRdIHx8IFtdO1xuXG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSBsaXN0ZW5lcnMubGVuZ3RoOyBpIDwgbDsgKytpKSB7XG4gICAgICBpZiAobGlzdGVuZXJzW2ldID09IGxpc3RlbmVyKSB7XG4gICAgICAgIHJldHVybiBsaXN0ZW5lcnMuc3BsaWNlKGksIDEpO1xuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICAvKlxuICAgIER1cGxpY2F0ZXMgdGhlIGJlaGF2aW9yIG9mIG5hdGl2ZSBYTUxIdHRwUmVxdWVzdCdzIGRpc3BhdGNoRXZlbnQgZnVuY3Rpb25cbiAgKi9cbiAgZGlzcGF0Y2hFdmVudDogZnVuY3Rpb24gZGlzcGF0Y2hFdmVudChldmVudCkge1xuICAgIHZhciB0eXBlID0gZXZlbnQudHlwZTtcbiAgICB2YXIgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRMaXN0ZW5lcnNbdHlwZV0gfHwgW107XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxpc3RlbmVycy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHR5cGVvZiBsaXN0ZW5lcnNbaV0gPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIGxpc3RlbmVyc1tpXS5jYWxsKHRoaXMsIGV2ZW50KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxpc3RlbmVyc1tpXS5oYW5kbGVFdmVudChldmVudCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuICEhZXZlbnQuZGVmYXVsdFByZXZlbnRlZDtcbiAgfSxcblxuICAvKlxuICAgIER1cGxpY2F0ZXMgdGhlIGJlaGF2aW9yIG9mIG5hdGl2ZSBYTUxIdHRwUmVxdWVzdCdzIHNldFJlcXVlc3RIZWFkZXIgZnVuY3Rpb25cbiAgKi9cbiAgc2V0UmVxdWVzdEhlYWRlcjogZnVuY3Rpb24gc2V0UmVxdWVzdEhlYWRlcihoZWFkZXIsIHZhbHVlKSB7XG4gICAgdmVyaWZ5U3RhdGUodGhpcyk7XG5cbiAgICBpZiAodW5zYWZlSGVhZGVyc1toZWFkZXJdIHx8IC9eKFNlYy18UHJveHktKS8udGVzdChoZWFkZXIpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJSZWZ1c2VkIHRvIHNldCB1bnNhZmUgaGVhZGVyIFxcXCJcIiArIGhlYWRlciArIFwiXFxcIlwiKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5yZXF1ZXN0SGVhZGVyc1toZWFkZXJdKSB7XG4gICAgICB0aGlzLnJlcXVlc3RIZWFkZXJzW2hlYWRlcl0gKz0gXCIsXCIgKyB2YWx1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5yZXF1ZXN0SGVhZGVyc1toZWFkZXJdID0gdmFsdWU7XG4gICAgfVxuICB9LFxuXG4gIC8qXG4gICAgRHVwbGljYXRlcyB0aGUgYmVoYXZpb3Igb2YgbmF0aXZlIFhNTEh0dHBSZXF1ZXN0J3Mgc2VuZCBmdW5jdGlvblxuICAqL1xuICBzZW5kOiBmdW5jdGlvbiBzZW5kKGRhdGEpIHtcbiAgICB2ZXJpZnlTdGF0ZSh0aGlzKTtcblxuICAgIGlmICghL14oZ2V0fGhlYWQpJC9pLnRlc3QodGhpcy5tZXRob2QpKSB7XG4gICAgICBpZiAodGhpcy5yZXF1ZXN0SGVhZGVyc1tcIkNvbnRlbnQtVHlwZVwiXSkge1xuICAgICAgICB2YXIgdmFsdWUgPSB0aGlzLnJlcXVlc3RIZWFkZXJzW1wiQ29udGVudC1UeXBlXCJdLnNwbGl0KFwiO1wiKTtcbiAgICAgICAgdGhpcy5yZXF1ZXN0SGVhZGVyc1tcIkNvbnRlbnQtVHlwZVwiXSA9IHZhbHVlWzBdICsgXCI7Y2hhcnNldD11dGYtOFwiO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5yZXF1ZXN0SGVhZGVyc1tcIkNvbnRlbnQtVHlwZVwiXSA9IFwidGV4dC9wbGFpbjtjaGFyc2V0PXV0Zi04XCI7XG4gICAgICB9XG5cbiAgICAgIHRoaXMucmVxdWVzdEJvZHkgPSBkYXRhO1xuICAgIH1cblxuICAgIHRoaXMuZXJyb3JGbGFnID0gZmFsc2U7XG4gICAgdGhpcy5zZW5kRmxhZyA9IHRoaXMuYXN5bmM7XG4gICAgdGhpcy5fcmVhZHlTdGF0ZUNoYW5nZShGYWtlWE1MSHR0cFJlcXVlc3QuT1BFTkVEKTtcblxuICAgIGlmICh0eXBlb2YgdGhpcy5vblNlbmQgPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICB0aGlzLm9uU2VuZCh0aGlzKTtcbiAgICB9XG5cbiAgICB0aGlzLmRpc3BhdGNoRXZlbnQobmV3IF9FdmVudChcImxvYWRzdGFydFwiLCBmYWxzZSwgZmFsc2UsIHRoaXMpKTtcbiAgfSxcblxuICAvKlxuICAgIER1cGxpY2F0ZXMgdGhlIGJlaGF2aW9yIG9mIG5hdGl2ZSBYTUxIdHRwUmVxdWVzdCdzIGFib3J0IGZ1bmN0aW9uXG4gICovXG4gIGFib3J0OiBmdW5jdGlvbiBhYm9ydCgpIHtcbiAgICB0aGlzLmFib3J0ZWQgPSB0cnVlO1xuICAgIHRoaXMucmVzcG9uc2VUZXh0ID0gbnVsbDtcbiAgICB0aGlzLmVycm9yRmxhZyA9IHRydWU7XG4gICAgdGhpcy5yZXF1ZXN0SGVhZGVycyA9IHt9O1xuXG4gICAgaWYgKHRoaXMucmVhZHlTdGF0ZSA+IEZha2VYTUxIdHRwUmVxdWVzdC5VTlNFTlQgJiYgdGhpcy5zZW5kRmxhZykge1xuICAgICAgdGhpcy5fcmVhZHlTdGF0ZUNoYW5nZShGYWtlWE1MSHR0cFJlcXVlc3QuRE9ORSk7XG4gICAgICB0aGlzLnNlbmRGbGFnID0gZmFsc2U7XG4gICAgfVxuXG4gICAgdGhpcy5yZWFkeVN0YXRlID0gRmFrZVhNTEh0dHBSZXF1ZXN0LlVOU0VOVDtcblxuICAgIHRoaXMuZGlzcGF0Y2hFdmVudChuZXcgX0V2ZW50KFwiYWJvcnRcIiwgZmFsc2UsIGZhbHNlLCB0aGlzKSk7XG4gICAgaWYgKHR5cGVvZiB0aGlzLm9uZXJyb3IgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICB0aGlzLm9uZXJyb3IoKTtcbiAgICB9XG4gIH0sXG5cbiAgLypcbiAgICBEdXBsaWNhdGVzIHRoZSBiZWhhdmlvciBvZiBuYXRpdmUgWE1MSHR0cFJlcXVlc3QncyBnZXRSZXNwb25zZUhlYWRlciBmdW5jdGlvblxuICAqL1xuICBnZXRSZXNwb25zZUhlYWRlcjogZnVuY3Rpb24gZ2V0UmVzcG9uc2VIZWFkZXIoaGVhZGVyKSB7XG4gICAgaWYgKHRoaXMucmVhZHlTdGF0ZSA8IEZha2VYTUxIdHRwUmVxdWVzdC5IRUFERVJTX1JFQ0VJVkVEKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBpZiAoL15TZXQtQ29va2llMj8kL2kudGVzdChoZWFkZXIpKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBoZWFkZXIgPSBoZWFkZXIudG9Mb3dlckNhc2UoKTtcblxuICAgIGZvciAodmFyIGggaW4gdGhpcy5yZXNwb25zZUhlYWRlcnMpIHtcbiAgICAgIGlmIChoLnRvTG93ZXJDYXNlKCkgPT0gaGVhZGVyKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJlc3BvbnNlSGVhZGVyc1toXTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbDtcbiAgfSxcblxuICAvKlxuICAgIER1cGxpY2F0ZXMgdGhlIGJlaGF2aW9yIG9mIG5hdGl2ZSBYTUxIdHRwUmVxdWVzdCdzIGdldEFsbFJlc3BvbnNlSGVhZGVycyBmdW5jdGlvblxuICAqL1xuICBnZXRBbGxSZXNwb25zZUhlYWRlcnM6IGZ1bmN0aW9uIGdldEFsbFJlc3BvbnNlSGVhZGVycygpIHtcbiAgICBpZiAodGhpcy5yZWFkeVN0YXRlIDwgRmFrZVhNTEh0dHBSZXF1ZXN0LkhFQURFUlNfUkVDRUlWRUQpIHtcbiAgICAgIHJldHVybiBcIlwiO1xuICAgIH1cblxuICAgIHZhciBoZWFkZXJzID0gXCJcIjtcblxuICAgIGZvciAodmFyIGhlYWRlciBpbiB0aGlzLnJlc3BvbnNlSGVhZGVycykge1xuICAgICAgaWYgKHRoaXMucmVzcG9uc2VIZWFkZXJzLmhhc093blByb3BlcnR5KGhlYWRlcikgJiYgIS9eU2V0LUNvb2tpZTI/JC9pLnRlc3QoaGVhZGVyKSkge1xuICAgICAgICBoZWFkZXJzICs9IGhlYWRlciArIFwiOiBcIiArIHRoaXMucmVzcG9uc2VIZWFkZXJzW2hlYWRlcl0gKyBcIlxcclxcblwiO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBoZWFkZXJzO1xuICB9LFxuXG4gIC8qXG4gICAgUGxhY2VzIGEgRmFrZVhNTEh0dHBSZXF1ZXN0IG9iamVjdCBpbnRvIHRoZSBwYXNzZWRcbiAgICBzdGF0ZS5cbiAgKi9cbiAgX3JlYWR5U3RhdGVDaGFuZ2U6IGZ1bmN0aW9uIF9yZWFkeVN0YXRlQ2hhbmdlKHN0YXRlKSB7XG4gICAgdGhpcy5yZWFkeVN0YXRlID0gc3RhdGU7XG5cbiAgICBpZiAodHlwZW9mIHRoaXMub25yZWFkeXN0YXRlY2hhbmdlID09IFwiZnVuY3Rpb25cIikge1xuICAgICAgdGhpcy5vbnJlYWR5c3RhdGVjaGFuZ2UoKTtcbiAgICB9XG5cbiAgICB0aGlzLmRpc3BhdGNoRXZlbnQobmV3IF9FdmVudChcInJlYWR5c3RhdGVjaGFuZ2VcIikpO1xuXG4gICAgaWYgKHRoaXMucmVhZHlTdGF0ZSA9PSBGYWtlWE1MSHR0cFJlcXVlc3QuRE9ORSkge1xuICAgICAgdGhpcy5kaXNwYXRjaEV2ZW50KG5ldyBfRXZlbnQoXCJsb2FkXCIsIGZhbHNlLCBmYWxzZSwgdGhpcykpO1xuICAgICAgdGhpcy5kaXNwYXRjaEV2ZW50KG5ldyBfRXZlbnQoXCJsb2FkZW5kXCIsIGZhbHNlLCBmYWxzZSwgdGhpcykpO1xuICAgIH1cbiAgfSxcblxuXG4gIC8qXG4gICAgU2V0cyB0aGUgRmFrZVhNTEh0dHBSZXF1ZXN0IG9iamVjdCdzIHJlc3BvbnNlIGhlYWRlcnMgYW5kXG4gICAgcGxhY2VzIHRoZSBvYmplY3QgaW50byByZWFkeVN0YXRlIDJcbiAgKi9cbiAgX3NldFJlc3BvbnNlSGVhZGVyczogZnVuY3Rpb24gX3NldFJlc3BvbnNlSGVhZGVycyhoZWFkZXJzKSB7XG4gICAgdGhpcy5yZXNwb25zZUhlYWRlcnMgPSB7fTtcblxuICAgIGZvciAodmFyIGhlYWRlciBpbiBoZWFkZXJzKSB7XG4gICAgICBpZiAoaGVhZGVycy5oYXNPd25Qcm9wZXJ0eShoZWFkZXIpKSB7XG4gICAgICAgICAgdGhpcy5yZXNwb25zZUhlYWRlcnNbaGVhZGVyXSA9IGhlYWRlcnNbaGVhZGVyXTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodGhpcy5hc3luYykge1xuICAgICAgdGhpcy5fcmVhZHlTdGF0ZUNoYW5nZShGYWtlWE1MSHR0cFJlcXVlc3QuSEVBREVSU19SRUNFSVZFRCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMucmVhZHlTdGF0ZSA9IEZha2VYTUxIdHRwUmVxdWVzdC5IRUFERVJTX1JFQ0VJVkVEO1xuICAgIH1cbiAgfSxcblxuXG5cbiAgLypcbiAgICBTZXRzIHRoZSBGYWtlWE1MSHR0cFJlcXVlc3Qgb2JqZWN0J3MgcmVzcG9uc2UgYm9keSBhbmRcbiAgICBpZiBib2R5IHRleHQgaXMgWE1MLCBzZXRzIHJlc3BvbnNlWE1MIHRvIHBhcnNlZCBkb2N1bWVudFxuICAgIG9iamVjdFxuICAqL1xuICBfc2V0UmVzcG9uc2VCb2R5OiBmdW5jdGlvbiBfc2V0UmVzcG9uc2VCb2R5KGJvZHkpIHtcbiAgICB2ZXJpZnlSZXF1ZXN0U2VudCh0aGlzKTtcbiAgICB2ZXJpZnlIZWFkZXJzUmVjZWl2ZWQodGhpcyk7XG4gICAgdmVyaWZ5UmVzcG9uc2VCb2R5VHlwZShib2R5KTtcblxuICAgIHZhciBjaHVua1NpemUgPSB0aGlzLmNodW5rU2l6ZSB8fCAxMDtcbiAgICB2YXIgaW5kZXggPSAwO1xuICAgIHRoaXMucmVzcG9uc2VUZXh0ID0gXCJcIjtcblxuICAgIGRvIHtcbiAgICAgIGlmICh0aGlzLmFzeW5jKSB7XG4gICAgICAgIHRoaXMuX3JlYWR5U3RhdGVDaGFuZ2UoRmFrZVhNTEh0dHBSZXF1ZXN0LkxPQURJTkcpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLnJlc3BvbnNlVGV4dCArPSBib2R5LnN1YnN0cmluZyhpbmRleCwgaW5kZXggKyBjaHVua1NpemUpO1xuICAgICAgaW5kZXggKz0gY2h1bmtTaXplO1xuICAgIH0gd2hpbGUgKGluZGV4IDwgYm9keS5sZW5ndGgpO1xuXG4gICAgdmFyIHR5cGUgPSB0aGlzLmdldFJlc3BvbnNlSGVhZGVyKFwiQ29udGVudC1UeXBlXCIpO1xuXG4gICAgaWYgKHRoaXMucmVzcG9uc2VUZXh0ICYmICghdHlwZSB8fCAvKHRleHRcXC94bWwpfChhcHBsaWNhdGlvblxcL3htbCl8KFxcK3htbCkvLnRlc3QodHlwZSkpKSB7XG4gICAgICB0cnkge1xuICAgICAgICB0aGlzLnJlc3BvbnNlWE1MID0gcGFyc2VYTUwodGhpcy5yZXNwb25zZVRleHQpO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAvLyBVbmFibGUgdG8gcGFyc2UgWE1MIC0gbm8gYmlnZ2llXG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuYXN5bmMpIHtcbiAgICAgIHRoaXMuX3JlYWR5U3RhdGVDaGFuZ2UoRmFrZVhNTEh0dHBSZXF1ZXN0LkRPTkUpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnJlYWR5U3RhdGUgPSBGYWtlWE1MSHR0cFJlcXVlc3QuRE9ORTtcbiAgICB9XG4gIH0sXG5cbiAgLypcbiAgICBGb3JjZXMgYSByZXNwb25zZSBvbiB0byB0aGUgRmFrZVhNTEh0dHBSZXF1ZXN0IG9iamVjdC5cblxuICAgIFRoaXMgaXMgdGhlIHB1YmxpYyBBUEkgZm9yIGZha2luZyByZXNwb25zZXMuIFRoaXMgZnVuY3Rpb25cbiAgICB0YWtlcyBhIG51bWJlciBzdGF0dXMsIGhlYWRlcnMgb2JqZWN0LCBhbmQgc3RyaW5nIGJvZHk6XG5cbiAgICBgYGBcbiAgICB4aHIucmVzcG9uZCg0MDQsIHtDb250ZW50LVR5cGU6ICd0ZXh0L3BsYWluJ30sIFwiU29ycnkuIFRoaXMgb2JqZWN0IHdhcyBub3QgZm91bmQuXCIpXG5cbiAgICBgYGBcbiAgKi9cbiAgcmVzcG9uZDogZnVuY3Rpb24gcmVzcG9uZChzdGF0dXMsIGhlYWRlcnMsIGJvZHkpIHtcbiAgICB0aGlzLl9zZXRSZXNwb25zZUhlYWRlcnMoaGVhZGVycyB8fCB7fSk7XG4gICAgdGhpcy5zdGF0dXMgPSB0eXBlb2Ygc3RhdHVzID09IFwibnVtYmVyXCIgPyBzdGF0dXMgOiAyMDA7XG4gICAgdGhpcy5zdGF0dXNUZXh0ID0gaHR0cFN0YXR1c0NvZGVzW3RoaXMuc3RhdHVzXTtcbiAgICB0aGlzLl9zZXRSZXNwb25zZUJvZHkoYm9keSB8fCBcIlwiKTtcbiAgICBpZiAodHlwZW9mIHRoaXMub25sb2FkID09PSBcImZ1bmN0aW9uXCIpe1xuICAgICAgdGhpcy5vbmxvYWQoKTtcbiAgICB9XG4gIH1cbn07XG5cbmZ1bmN0aW9uIHZlcmlmeVN0YXRlKHhocikge1xuICBpZiAoeGhyLnJlYWR5U3RhdGUgIT09IEZha2VYTUxIdHRwUmVxdWVzdC5PUEVORUQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJJTlZBTElEX1NUQVRFX0VSUlwiKTtcbiAgfVxuXG4gIGlmICh4aHIuc2VuZEZsYWcpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJJTlZBTElEX1NUQVRFX0VSUlwiKTtcbiAgfVxufVxuXG5cbmZ1bmN0aW9uIHZlcmlmeVJlcXVlc3RTZW50KHhocikge1xuICAgIGlmICh4aHIucmVhZHlTdGF0ZSA9PSBGYWtlWE1MSHR0cFJlcXVlc3QuRE9ORSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJSZXF1ZXN0IGRvbmVcIik7XG4gICAgfVxufVxuXG5mdW5jdGlvbiB2ZXJpZnlIZWFkZXJzUmVjZWl2ZWQoeGhyKSB7XG4gICAgaWYgKHhoci5hc3luYyAmJiB4aHIucmVhZHlTdGF0ZSAhPSBGYWtlWE1MSHR0cFJlcXVlc3QuSEVBREVSU19SRUNFSVZFRCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJObyBoZWFkZXJzIHJlY2VpdmVkXCIpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gdmVyaWZ5UmVzcG9uc2VCb2R5VHlwZShib2R5KSB7XG4gICAgaWYgKHR5cGVvZiBib2R5ICE9IFwic3RyaW5nXCIpIHtcbiAgICAgICAgdmFyIGVycm9yID0gbmV3IEVycm9yKFwiQXR0ZW1wdGVkIHRvIHJlc3BvbmQgdG8gZmFrZSBYTUxIdHRwUmVxdWVzdCB3aXRoIFwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYm9keSArIFwiLCB3aGljaCBpcyBub3QgYSBzdHJpbmcuXCIpO1xuICAgICAgICBlcnJvci5uYW1lID0gXCJJbnZhbGlkQm9keUV4Y2VwdGlvblwiO1xuICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG59XG5cbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xuICBtb2R1bGUuZXhwb3J0cyA9IEZha2VYTUxIdHRwUmVxdWVzdDtcbn0gZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gIGRlZmluZShmdW5jdGlvbigpIHsgcmV0dXJuIEZha2VYTUxIdHRwUmVxdWVzdDsgfSk7XG59IGVsc2UgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XG4gIHdpbmRvdy5GYWtlWE1MSHR0cFJlcXVlc3QgPSBGYWtlWE1MSHR0cFJlcXVlc3Q7XG59IGVsc2UgaWYgKHRoaXMpIHtcbiAgdGhpcy5GYWtlWE1MSHR0cFJlcXVlc3QgPSBGYWtlWE1MSHR0cFJlcXVlc3Q7XG59XG59KSgpO1xuIiwiKGZ1bmN0aW9uIChnbG9iYWwpe1xuIWZ1bmN0aW9uKGUpe2lmKFwib2JqZWN0XCI9PXR5cGVvZiBleHBvcnRzKW1vZHVsZS5leHBvcnRzPWUoKTtlbHNlIGlmKFwiZnVuY3Rpb25cIj09dHlwZW9mIGRlZmluZSYmZGVmaW5lLmFtZClkZWZpbmUoZSk7ZWxzZXt2YXIgZjtcInVuZGVmaW5lZFwiIT10eXBlb2Ygd2luZG93P2Y9d2luZG93OlwidW5kZWZpbmVkXCIhPXR5cGVvZiBnbG9iYWw/Zj1nbG9iYWw6XCJ1bmRlZmluZWRcIiE9dHlwZW9mIHNlbGYmJihmPXNlbGYpLGYucm91dGVzPWUoKX19KGZ1bmN0aW9uKCl7dmFyIGRlZmluZSxtb2R1bGUsZXhwb3J0cztyZXR1cm4gKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkoezE6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xuXG52YXIgbG9jYWxSb3V0ZXMgPSBbXTtcblxuXG4vKipcbiAqIENvbnZlcnQgcGF0aCB0byByb3V0ZSBvYmplY3RcbiAqXG4gKiBBIHN0cmluZyBvciBSZWdFeHAgc2hvdWxkIGJlIHBhc3NlZCxcbiAqIHdpbGwgcmV0dXJuIHsgcmUsIHNyYywga2V5c30gb2JqXG4gKlxuICogQHBhcmFtICB7U3RyaW5nIC8gUmVnRXhwfSBwYXRoXG4gKiBAcmV0dXJuIHtPYmplY3R9XG4gKi9cblxudmFyIFJvdXRlID0gZnVuY3Rpb24ocGF0aCl7XG4gIC8vdXNpbmcgJ25ldycgaXMgb3B0aW9uYWxcblxuICB2YXIgc3JjLCByZSwga2V5cyA9IFtdO1xuXG4gIGlmKHBhdGggaW5zdGFuY2VvZiBSZWdFeHApe1xuICAgIHJlID0gcGF0aDtcbiAgICBzcmMgPSBwYXRoLnRvU3RyaW5nKCk7XG4gIH1lbHNle1xuICAgIHJlID0gcGF0aFRvUmVnRXhwKHBhdGgsIGtleXMpO1xuICAgIHNyYyA9IHBhdGg7XG4gIH1cblxuICByZXR1cm4ge1xuICBcdCByZTogcmUsXG4gIFx0IHNyYzogcGF0aC50b1N0cmluZygpLFxuICBcdCBrZXlzOiBrZXlzXG4gIH1cbn07XG5cbi8qKlxuICogTm9ybWFsaXplIHRoZSBnaXZlbiBwYXRoIHN0cmluZyxcbiAqIHJldHVybmluZyBhIHJlZ3VsYXIgZXhwcmVzc2lvbi5cbiAqXG4gKiBBbiBlbXB0eSBhcnJheSBzaG91bGQgYmUgcGFzc2VkLFxuICogd2hpY2ggd2lsbCBjb250YWluIHRoZSBwbGFjZWhvbGRlclxuICoga2V5IG5hbWVzLiBGb3IgZXhhbXBsZSBcIi91c2VyLzppZFwiIHdpbGxcbiAqIHRoZW4gY29udGFpbiBbXCJpZFwiXS5cbiAqXG4gKiBAcGFyYW0gIHtTdHJpbmd9IHBhdGhcbiAqIEBwYXJhbSAge0FycmF5fSBrZXlzXG4gKiBAcmV0dXJuIHtSZWdFeHB9XG4gKi9cbnZhciBwYXRoVG9SZWdFeHAgPSBmdW5jdGlvbiAocGF0aCwga2V5cykge1xuXHRwYXRoID0gcGF0aFxuXHRcdC5jb25jYXQoJy8/Jylcblx0XHQucmVwbGFjZSgvXFwvXFwoL2csICcoPzovJylcblx0XHQucmVwbGFjZSgvKFxcLyk/KFxcLik/OihcXHcrKSg/OihcXCguKj9cXCkpKT8oXFw/KT98XFwqL2csIGZ1bmN0aW9uKF8sIHNsYXNoLCBmb3JtYXQsIGtleSwgY2FwdHVyZSwgb3B0aW9uYWwpe1xuXHRcdFx0aWYgKF8gPT09IFwiKlwiKXtcblx0XHRcdFx0a2V5cy5wdXNoKHVuZGVmaW5lZCk7XG5cdFx0XHRcdHJldHVybiBfO1xuXHRcdFx0fVxuXG5cdFx0XHRrZXlzLnB1c2goa2V5KTtcblx0XHRcdHNsYXNoID0gc2xhc2ggfHwgJyc7XG5cdFx0XHRyZXR1cm4gJydcblx0XHRcdFx0KyAob3B0aW9uYWwgPyAnJyA6IHNsYXNoKVxuXHRcdFx0XHQrICcoPzonXG5cdFx0XHRcdCsgKG9wdGlvbmFsID8gc2xhc2ggOiAnJylcblx0XHRcdFx0KyAoZm9ybWF0IHx8ICcnKSArIChjYXB0dXJlIHx8ICcoW14vXSs/KScpICsgJyknXG5cdFx0XHRcdCsgKG9wdGlvbmFsIHx8ICcnKTtcblx0XHR9KVxuXHRcdC5yZXBsYWNlKC8oW1xcLy5dKS9nLCAnXFxcXCQxJylcblx0XHQucmVwbGFjZSgvXFwqL2csICcoLiopJyk7XG5cdHJldHVybiBuZXcgUmVnRXhwKCdeJyArIHBhdGggKyAnJCcsICdpJyk7XG59O1xuXG4vKipcbiAqIEF0dGVtcHQgdG8gbWF0Y2ggdGhlIGdpdmVuIHJlcXVlc3QgdG9cbiAqIG9uZSBvZiB0aGUgcm91dGVzLiBXaGVuIHN1Y2Nlc3NmdWxcbiAqIGEgIHtmbiwgcGFyYW1zLCBzcGxhdHN9IG9iaiBpcyByZXR1cm5lZFxuICpcbiAqIEBwYXJhbSAge0FycmF5fSByb3V0ZXNcbiAqIEBwYXJhbSAge1N0cmluZ30gdXJpXG4gKiBAcmV0dXJuIHtPYmplY3R9XG4gKi9cbnZhciBtYXRjaCA9IGZ1bmN0aW9uIChyb3V0ZXMsIHVyaSwgc3RhcnRBdCkge1xuXHR2YXIgY2FwdHVyZXMsIGkgPSBzdGFydEF0IHx8IDA7XG5cblx0Zm9yICh2YXIgbGVuID0gcm91dGVzLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG5cdFx0dmFyIHJvdXRlID0gcm91dGVzW2ldLFxuXHRcdCAgICByZSA9IHJvdXRlLnJlLFxuXHRcdCAgICBrZXlzID0gcm91dGUua2V5cyxcblx0XHQgICAgc3BsYXRzID0gW10sXG5cdFx0ICAgIHBhcmFtcyA9IHt9O1xuXG5cdFx0aWYgKGNhcHR1cmVzID0gdXJpLm1hdGNoKHJlKSkge1xuXHRcdFx0Zm9yICh2YXIgaiA9IDEsIGxlbiA9IGNhcHR1cmVzLmxlbmd0aDsgaiA8IGxlbjsgKytqKSB7XG5cdFx0XHRcdHZhciBrZXkgPSBrZXlzW2otMV0sXG5cdFx0XHRcdFx0dmFsID0gdHlwZW9mIGNhcHR1cmVzW2pdID09PSAnc3RyaW5nJ1xuXHRcdFx0XHRcdFx0PyB1bmVzY2FwZShjYXB0dXJlc1tqXSlcblx0XHRcdFx0XHRcdDogY2FwdHVyZXNbal07XG5cdFx0XHRcdGlmIChrZXkpIHtcblx0XHRcdFx0XHRwYXJhbXNba2V5XSA9IHZhbDtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRzcGxhdHMucHVzaCh2YWwpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRwYXJhbXM6IHBhcmFtcyxcblx0XHRcdFx0c3BsYXRzOiBzcGxhdHMsXG5cdFx0XHRcdHJvdXRlOiByb3V0ZS5zcmMsXG5cdFx0XHRcdG5leHQ6IGkgKyAxXG5cdFx0XHR9O1xuXHRcdH1cblx0fVxufTtcblxuLyoqXG4gKiBEZWZhdWx0IFwibm9ybWFsXCIgcm91dGVyIGNvbnN0cnVjdG9yLlxuICogYWNjZXB0cyBwYXRoLCBmbiB0dXBsZXMgdmlhIGFkZFJvdXRlXG4gKiByZXR1cm5zIHtmbiwgcGFyYW1zLCBzcGxhdHMsIHJvdXRlfVxuICogIHZpYSBtYXRjaFxuICpcbiAqIEByZXR1cm4ge09iamVjdH1cbiAqL1xuXG52YXIgUm91dGVyID0gZnVuY3Rpb24oKXtcbiAgLy91c2luZyAnbmV3JyBpcyBvcHRpb25hbFxuICByZXR1cm4ge1xuICAgIHJvdXRlczogW10sXG4gICAgcm91dGVNYXAgOiB7fSxcbiAgICBhZGRSb3V0ZTogZnVuY3Rpb24ocGF0aCwgZm4pe1xuICAgICAgaWYgKCFwYXRoKSB0aHJvdyBuZXcgRXJyb3IoJyByb3V0ZSByZXF1aXJlcyBhIHBhdGgnKTtcbiAgICAgIGlmICghZm4pIHRocm93IG5ldyBFcnJvcignIHJvdXRlICcgKyBwYXRoLnRvU3RyaW5nKCkgKyAnIHJlcXVpcmVzIGEgY2FsbGJhY2snKTtcblxuICAgICAgdmFyIHJvdXRlID0gUm91dGUocGF0aCk7XG4gICAgICByb3V0ZS5mbiA9IGZuO1xuXG4gICAgICB0aGlzLnJvdXRlcy5wdXNoKHJvdXRlKTtcbiAgICAgIHRoaXMucm91dGVNYXBbcGF0aF0gPSBmbjtcbiAgICB9LFxuXG4gICAgbWF0Y2g6IGZ1bmN0aW9uKHBhdGhuYW1lLCBzdGFydEF0KXtcbiAgICAgIHZhciByb3V0ZSA9IG1hdGNoKHRoaXMucm91dGVzLCBwYXRobmFtZSwgc3RhcnRBdCk7XG4gICAgICBpZihyb3V0ZSl7XG4gICAgICAgIHJvdXRlLmZuID0gdGhpcy5yb3V0ZU1hcFtyb3V0ZS5yb3V0ZV07XG4gICAgICAgIHJvdXRlLm5leHQgPSB0aGlzLm1hdGNoLmJpbmQodGhpcywgcGF0aG5hbWUsIHJvdXRlLm5leHQpXG4gICAgICB9XG4gICAgICByZXR1cm4gcm91dGU7XG4gICAgfVxuICB9XG59O1xuXG5Sb3V0ZXIuUm91dGUgPSBSb3V0ZVxuUm91dGVyLnBhdGhUb1JlZ0V4cCA9IHBhdGhUb1JlZ0V4cFxuUm91dGVyLm1hdGNoID0gbWF0Y2hcbi8vIGJhY2sgY29tcGF0XG5Sb3V0ZXIuUm91dGVyID0gUm91dGVyXG5cbm1vZHVsZS5leHBvcnRzID0gUm91dGVyXG5cbn0se31dfSx7fSxbMV0pXG4oMSlcbn0pO1xufSkuY2FsbCh0aGlzLHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwgOiB0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pIl19
