// UMD (Universal Module Definition)
(function (root, factory)
{
  if (typeof define === 'function' && define.amd) // jshint ignore:line
  {
    // AMD. Register as an anonymous module.
    define(['rekord'], function(Rekord) { // jshint ignore:line
      return factory(root, Rekord);
    });
  }
  else if (typeof module === 'object' && module.exports)  // jshint ignore:line
  {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory(global, require('rekord'));  // jshint ignore:line
  }
  else
  {
    // Browser globals (root is window)
    root.Rekord = factory(root, root.Rekord);
  }
}(this, function(global, Rekord, undefined)
{

  var win = typeof window !== 'undefined' ? window : global;   // jshint ignore:line

  var copy = Rekord.copy;
  var noop = Rekord.noop;
  var transfer = Rekord.transfer;
  var format = Rekord.format;
  var isFormatInput = Rekord.isFormatInput;
  var isEmpty = Rekord.isEmpty;
  var isNumber = Rekord.isNumber;
  var isObject = Rekord.isObject;
  var isString = Rekord.isString;
  var Rekord_rest = Rekord.rest;

  var XHR = win.XMLHttpRequest || noop;
  var XDR = 'withCredentials' in (new XHR()) ? XHR : win.XDomainRequest;

  var clearTimeout = win.clearTimeout;
  var setTimeout = win.setTimeout;

  function Rest(database)
  {
    this.database = database;
  }

  Rest.prototype =
  {
    removeTrailingSlash: function(x)
    {
      return x.charAt(x.length - 1) === '/' ? x.substring(0, x.length - 1) : x;
    },
    buildURL: function(model)
    {
      return this.removeTrailingSlash( Rekord.Ajax.buildURL( this.database, model ) );
    },
    all: function( options, success, failure )
    {
      this.execute( 'GET', null, undefined, this.buildURL(), options, success, failure, [] );
    },
    get: function( model, options, success, failure )
    {
      this.execute( 'GET', model, undefined, this.buildURL( model ), options, success, failure );
    },
    create: function( model, encoded, options, success, failure )
    {
      this.execute( 'POST', model, encoded, this.buildURL(), options, success, failure, {} );
    },
    update: function( model, encoded, options, success, failure )
    {
      this.execute( 'PUT', model, encoded, this.buildURL( model ), options, success, failure, {} );
    },
    remove: function( model, options, success, failure )
    {
      this.execute( 'DELETE', model, undefined, this.buildURL( model ), options, success, failure, {} );
    },
    query: function( url, data, options, success, failure )
    {
      var method = isEmpty( data ) ? 'GET' : 'POST';

      this.execute( method, null, data, url, options, success, failure );
    },
    encode: function(params, prefix)
    {
      var str = [], p;

      for (var p in params)
      {
        if ( params.hasOwnProperty( p ) )
        {
          var k = prefix ? prefix + '[' + p + ']' : p;
          var v = params[ p ];

          str.push( isObject( v ) ? this.encode(v, k) : win.encodeURIComponent( k ) + '=' + win.encodeURIComponent( v ) );
        }
      }

      return str.join('&');
    },
    execute: function( method, model, data, url, extraOptions, success, failure, offlineValue )
    {
      Rekord.debug( Rekord.Debugs.REST, this, method, url, data );

      if ( Rekord.forceOffline )
      {
        failure( offlineValue, 0 );
      }
      else
      {
        var aborted;
        var timeoutTimer;
        var options = copy( Rekord.Ajax.options );

        if ( isObject( extraOptions ) )
        {
          transfer( extraOptions, options );
        }

        var headers = options.headers = options.headers || {};
        var xhr = options.cors || options.useXDR ? new XDR() : new XHR();
        var vars = transfer( Rekord.Ajax.vars, transfer( model, {} ) );

        options.method = method;
        options.url = url;
        options.data = data;

        if ( isObject( extraOptions ) )
        {
          transfer( extraOptions, options );

          if ( isObject( extraOptions.params ) )
          {
            var paramString = this.encode( extraOptions.params );
            var queryIndex = options.url.indexOf('?');

            options.url += queryIndex === -1 ? '?' : '&';
            options.url += paramString;
          }

          if ( isObject( extraOptions.vars ) )
          {
            transfer( extraOptions.vars, vars );
          }
        }

        Rekord.Ajax.adjustOptions( options, this.database, method, model, data, url, vars, extraOptions, success, failure );

        if ( isFormatInput( options.url ) )
        {
          options.url = format( options.url, vars );
        }

        var onReadyStateChange = function()
        {
          if (xhr.readyState === 4)
          {
            onLoaded();
          }
        };

        var getBody = function()
        {
          var body;

          if ( xhr.response )
          {
            body = xhr.response;
          }
          else if ( xhr.responseType === "text" || !xhr.responseType )
          {
            body = xhr.responseText || xhr.responseXML;
          }

          try
          {
            body = JSON.parse( body );
          }
          catch (e) {}

          return body;
        };

        var onLoaded = function()
        {
          if ( aborted )
          {
            return;
          }

          var status = (options.useXDR && xhr.status === undefined ? 200 : (xhr.status === 1223 ? 204 : xhr.status)) || 0;
          var response = getBody();

          if ( status !== 0 )
          {
            success( response );
          }
          else
          {
            failure( response, 0 );
          }

          success = noop;
          failure = noop;
          clearTimeout( timeoutTimer );
        };

        var onError = function()
        {
          failure( null, 0 );
          failure = noop;
          success = noop;
          clearTimeout( timeoutTimer );
        };

        var onTimeout = function()
        {
          aborted = true;
          xhr.abort('timeout');
          onError();
        };

        headers['Accept'] = 'application/json'; // jshint ignore:line

        if ( method !== "GET" && method !== "HEAD" )
        {
          headers['Content-Type'] = 'application/json';
          options.data = JSON.stringify( options.data );
        }

        xhr.onreadystatechange = onReadyStateChange;
        xhr.onload = onLoaded;
        xhr.onerror = onError;
        xhr.onprogress = function() {};
        xhr.ontimeout = onError;
        xhr.open( options.method, options.url, true, options.username, options.password );
        xhr.withCredentials = !!options.withCredentials;

        if ( isNumber( options.timeout ) && options.timeout > 0 )
        {
          timeoutTimer = setTimeout( onTimeout, options.timeout );
        }

        if (xhr.setRequestHeader)
        {
          for( var key in headers )
          {
            if( headers.hasOwnProperty( key ) )
            {
              xhr.setRequestHeader( key, headers[ key ] );
            }
          }
        }

        Rekord.Ajax.ajax( xhr, options );
      }
    }
  };

  function RestFactory(database)
  {
    if ( !database.api )
    {
      return Rekord_rest.call( this, database );
    }

    return new Rest( database );
  }

  function ajax(xhr, options)
  {
    xhr.send( options.data );
  }

  function buildURL(db, model)
  {
    return model ? db.api + model.$key() : db.api;
  }

  Rekord.Rests.Ajax = RestFactory;
  Rekord.setRest( RestFactory, true );

  Rekord.Ajax =
  {
    rest: RestFactory,
    options: {},
    vars: {},
    adjustOptions: noop,
    ajax: ajax,
    buildURL: buildURL,
    RestClass: Rest
  };

  return Rekord;

}));
