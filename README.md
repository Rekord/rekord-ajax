# <img src="https://raw.githubusercontent.com/Rekord/rekord/master/images/rekord-color.png" width="60"> rekord-ajax

[![Build Status](https://travis-ci.org/Rekord/rekord-ajax.svg?branch=master)](https://travis-ci.org/Rekord/rekord-ajax)
[![devDependency Status](https://david-dm.org/Rekord/rekord-ajax/dev-status.svg)](https://david-dm.org/Rekord/rekord-ajax#info=devDependencies)
[![Dependency Status](https://david-dm.org/Rekord/rekord-ajax.svg)](https://david-dm.org/Rekord/rekord-ajax)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/Rekord/rekord/blob/master/LICENSE)
[![Alpha](https://img.shields.io/badge/State-Alpha-orange.svg)]()

A dependency free AJAX implementation of Rekord.rest.

The easiest way to install is by using bower via `bower install rekord-ajax`.

### Additional Options

- `username` - The optional user name to use for authentication purpose.
- `password` - The optional password to use for authentication purposes.
- `headers` - An object of headers that should be set on the request. The key, value pair is passed to `XMLHttpRequest.setRequestHeader`.
- `cors`/`useXDR` - Specify whether this is a cross origin (CORS) request for IE<10. Switches IE to use `XDomainRequest` instead of `XMLHttpRequest`. Ignored in other browsers. Note that headers cannot be set on an `XDomainRequest` instance.
- `withCredentials` - Specify whether user credentials are to be included in a cross-origin request. Sets `XMLHttpRequest.withCredentials`. Defaults to false. A wildcard * cannot be used in the `Access-Control-Allow-Origin` header when `withCredentials` is true. The header needs to specify your origin explicitly or browser will abort the request.
- `timeout` - Number of milliseconds to wait for response. Defaults to 0 (no timeout). Ignored when options.sync is true.


```javascript
// Add global options
Rekord.Ajax.options.username = 'John';
Rekord.Ajax.options.password = 'password#1';

// Add/override options dynamically
Rekord.Ajax.adjustOptions = function(options, database, method, model, data, url, success, failure) {
  if (database.name === 'todos' && model) {
    options.url = database.api + model.list_id + '/todos/' + model.$$key();
  }
};

// The class instantiated with a database instance that implements Rekord.rest
Rekord.Ajax.RestClass;

// The function which returns a Rekord.rest implementation given a database
// Normally Rekord.rest is the same value but multiple back-ends could be used
Rekord.Ajax.rest;
```
