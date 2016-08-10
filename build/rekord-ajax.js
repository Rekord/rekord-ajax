/* rekord-ajax 1.4.0 - A dependency free AJAX implementation of Rekord.rest by Philip Diffenderfer */
(function (global, Rekord, undefined)
{
  var copy = Rekord.copy;
  var noop = Rekord.noop;
  var isEmpty = Rekord.isEmpty;
  var isNumber = Rekord.isNumber;
  var Rekord_rest = Rekord.rest;

  var XHR = global.XMLHttpRequest || noop;
  var XDR = 'withCredentials' in (new XHR()) ? XHR : global.XDomainRequest;

  var clearTimeout = global.clearTimeout;
  var setTimeout = global.setTimeout;

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
    all: function( success, failure )
    {
      this.execute( 'GET', null, undefined, this.database.api, success, failure, [] );
    },
    get: function( model, success, failure )
    {
      this.execute( 'GET', model, undefined, this.removeTrailingSlash( this.database.api + model.$key() ), success, failure );
    },
    create: function( model, encoded, success, failure )
    {
      this.execute( 'POST', model, encoded, this.removeTrailingSlash( this.database.api ), success, failure, {} );
    },
    update: function( model, encoded, success, failure )
    {
      this.execute( 'PUT', model, encoded, this.removeTrailingSlash( this.database.api + model.$key() ), success, failure, {} );
    },
    remove: function( model, success, failure )
    {
      this.execute( 'DELETE', model, undefined, this.removeTrailingSlash( this.database.api + model.$key() ), success, failure, {} );
    },
    query: function( url, data, success, failure )
    {
      var method = isEmpty( data ) ? 'GET' : 'POST';

      this.execute( method, null, data, url, success, failure );
    },
    execute: function( method, model, data, url, success, failure, offlineValue )
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
        var headers = options.headers = options.headers || {};
        var xhr = options.cors || options.useXDR ? new XDR() : new XHR();

        options.method = method;
        options.url = url;
        options.data = data;

        Rekord.Ajax.adjustOptions( options, this.database, method, model, data, url, success, failure );

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

  Rekord.setRest( RestFactory, true );

  Rekord.Ajax =
  {
    rest: RestFactory,
    options: {},
    adjustOptions: noop,
    ajax: ajax,
    RestClass: Rest
  };

})( this, this.Rekord );
