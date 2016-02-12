(function(global) {
  // ======================================== ROOT
  if( global["BO"] == null ) {
    global["BO"] = {};
  }
  var M = global["BO"];

  M.ST_OK = 0;
  M.ST_ERROR = 1;

  // ================================ URL
  M.Url = function(url) {
    this.url = url;
    this.protocol = null;
    this.user = null;
    this.password = null;
    this.host = null;
    this.port = null;
    this.path = null;
    this.params = null;
    if( url != null ) {
      url = "" + url; // to string
      var ix_endproto = url.indexOf(":");
      if( ix_endproto >= 0 ) {
        // has protocol
        this.protocol = url.substr(0,ix_endproto);
        url = url.substr(ix_endproto+1);
        switch( this.protocol ) {
        case "http":
        case "https":
        case "ftp":
        case "file":
          // //[<username>][:<password>]@[<host>[:<port>]][/<path>][?<params>]
          // //[<host>[:<port>]][/<path>][?<params>]
          // //[A-Z]:[\<iepath>][?<params>]
          if( url.substr(0, 2) == "//" ) {
            url = url.substr(2);
          }
          var ch1 = url.charAt(0);
          var ch2 = url.charAt(1);
          var ix1 = url.indexOf("\\");
          if( (ch1 >= "a" && ch1 <= "z" || ch1 >= "A" && ch1 <= "Z")
              && ch2 == ":"
              && ix1 >= 0
          ) {
            // IE file
            arr_hostpath = url.split("\\");
          }
          else {
            // user part
            var ix_user = url.indexOf("@");
            if( ix_user >= 0 ) {
              var user = url.substr(0, ix_user);
              var ix_pass = user.indexOf(":");
              if( ix_pass >= 0 ) {
                this.user = user.substr(0, ix_pass);
                this.password = user.substr(ix_pass+1);
              }
              else {
                this.user = user;
              }
              url = url.substr(ix_user+1);
            }
            // host+port and path
            var arr_hostpath = url.split("/");
            var host_port = arr_hostpath.shift();
            var ix_port = host_port.indexOf(":");
            if( ix_port >= 0 ) {
              this.host = host_port.substr(0, ix_port);
              this.port = host_port.substr(ix_port+1);
            }
            else {
              this.host = host_port;
            }
          }
          if( arr_hostpath.length > 0 ) {
            // params
            var lastpart = arr_hostpath[arr_hostpath.length-1];
            var ix_params = lastpart.indexOf("?");
            if( ix_params >= 0 ) {
              this.params = {};
              var arr_kvps = lastpart.substr(ix_params+1).split("&");
              for( var n = 0; n < arr_kvps.length; n++ ) {
                var kvp = arr_kvps[n].split("=");
                var key = decodeURIComponent(kvp.shift());
                var val = decodeURIComponent(kvp.join("="));
                this.params[key] = val;
              }
              // updates lastpart (deletes params)
              arr_hostpath[arr_hostpath.length-1] = lastpart.substr(0, ix_params);
            }
          }
          this.path = "/" + arr_hostpath.join("/");
          break;
//        case "mailto":
//          // <addr1>[,<addr2>,...]?<kvp1>[&<kvp2>...]
//          break;
        }
      }
    }
  };

  M.Url.prototype.body = function() {
    var ret = "";
    switch( this.protocol ) {
    case "http":
    case "https":
    case "ftp":
    case "file":
      ret = ret + this.protocol + "://";
      if( this.user != null || this.password != null ) {
        if( this.user != null ) {
          ret = ret + this.user;
        }
        if( this.password != null ) {
          ret = ret + ":" + this.password;
        }
        ret = ret + "@";
      }
      if( this.host != null ) {
        ret = ret + this.host;
      }
      if( this.port != null ) {
        ret = ret + ":" + this.port;
      }
      ret = ret + this.path;
      break;
    }
    return ret;
  };

  M.Url.prototype.param = function(key, value) {
    var ac = arguments != null ? arguments.length : 0;
    if( ac < 1 ) {
      // Getter without key
      return null;
    }
    if( ac == 1 ) {
      // Getter
      return this.params != null && key != null && key in this.params ? this.params[key] : null;
    }
    // Setter
    if( this.params == null ) {
      this.params = {};
    }
    this.params[key] = value;
  };

  M.Url.prototype.toString = function() {
    var ret = this.body();
    switch( this.protocol ) {
    case "http":
    case "https":
    case "ftp":
    case "file":
      if( this.params != null ) {
        var delim = "?";
        for(var k in this.params ) {
          ret = ret + delim +
            encodeURIComponent(k) +
            "=" +
            encodeURIComponent(this.params[k]);
          delim = "&";
        }
      }
      break;
    }
    return ret;
  };

  M.anim = function(v_start, v_finish, milliseconds, callback, opts) {
    this.v_start = v_start;
    this.v_finish = v_finish;
    this.v_diff = this.v_finish - this.v_start;
    this.milliseconds = milliseconds;
    this.callback = callback;
    this.interval_ms = 100;
    if( opts != null ) {
      if( opts.interval_ms > 0 ) {
        this.interval_ms = opts.interval_ms;
      }
    }
  };

  M.anim.ST_START = 1;
  M.anim.ST_TICK = 2;
  M.anim.ST_FINISH = 3;
  M.anim.ST_CANCEL = 4;

  M.anim.prototype.start = function() {
    this.ms_start = Date.now();
    this.ms_finish = this.ms_start + this.milliseconds;
    var tick = function(_this) {
      return function() {
        var ms = Date.now();
        if( ms > _this.ms_finish ) {
          clearInterval(_this.iid);
          _this.iid = null;
          _this.callback(BO.anim.ST_FINISH, _this.v_finish);
        }
        var r = _this.rate(_this.ms_start, _this.ms_finish, ms);
        var v = _this.v_start + _this.v_diff * r;
        _this.callback(BO.anim.ST_TICK, v);
      };
    }(this);

    this.iid = setInterval(tick, this.interval_ms);
  }

  M.anim.prototype.cancel = function() {
    clearInterval(_this.iid);
    _this.iid = null;
    callback(
      BO.anim.ST_CANCEL,
      this.v_finish
    );
  };

  M.anim.prototype.rate = function(ms_start, ms_finish, ms) {
    return (ms-ms_start)/(ms_finish-ms_start);
  };

  // ================================ INTERNAL
  /**
   * User Agent class.
   */
  function _UserAgent() {
    // type
    if( document.uniqueID ) {
      // IE
      this.type = "ie";
      if( typeof window.addEventListener == "undefined" &&
          typeof document.documentElement.style.maxHeight == "undefined" ) {
        this.ver = 6;
      }
      else if( typeof window.addEventListener == "undefined" &&
          typeof document.querySelectorAll == "undefined" ) {
        this.ver = 7;
      }
      else if( typeof window.addEventListener == "undefined" &&
          typeof document.getElementsByClassName == "undefined" ) {
        this.ver = 8;
      }
      else {
        this.ver = -1;
      }
    }
    else if( window.sidebar ) {
      // FireFox
      this.type = "firefox";
    }
    else if( window.opera ) {
      // Opera
      this.type = "opera";
    }
    else if( window.localStorage && typeof window.orientation == "undefined" ) {
      // Webkit
      this.type = "webkit";
    }
    else {
      this.type = "";
    }
    // mobile
    this.mobile = typeof window.orientation != "undefined";
  };
  _UserAgent.prototype.isIE6 = function() {
    return this.type == "ie" && this.ver == 6;
  };
  _UserAgent.prototype.isIE7OrLess = function() {
    return this.type == "ie" && this.ver > 0 && this.ver <= 7;
  };
  _UserAgent.prototype.isIE7 = function() {
    return this.type == "ie" && this.ver == 7;
  };
  _UserAgent.prototype.isIE8OrLess = function() {
    return this.type == "ie" && this.ver > 0 && this.ver <= 8;
  };
  _UserAgent.prototype.isIE8 = function() {
    return this.type == "ie" && this.ver == 8;
  };
  _UserAgent.prototype.isMobile = function() {
    return this.mobile;
  };

  function _EstimateLC() {
    if( document != null ) {
      if( document.URL != null ) {
        var url = new M.Url(document.URL);
        var url_lang = url.param("lc");
        if( url_lang ) {
          return url_lang;
        }
      }
      if( document.getElementsByTagName != null ) {
        var htmls = document.getElementsByTagName("html");
        if( htmls != null ) {
          for(var n = 0; n < htmls.length; n++ ) {
            var html = htmls[n];
            if( html != null && html.getAttribute != null) {
              var html_lang = html.getAttribute("lang");
              if( html_lang != null ) {
                return html_lang;
              }
            }
          }
        }
      }
    }
    if( navigator != null ) {
      var ret = navigator.userLanguage ||
        navigator.browserLanguage ||
        navigator.language;
      if( ret != null ) {
        return ret;
      }
    }
    return "C";
  };

  function _Res(lc) {
    if( lc != null ) {
      this.lc = lc;
    }
    else {
      this.lc = _EstimateLC();
    }
    this.arr = {};
  };

  _Res.prototype.put = function(key, default_value, valuehash) {
    this.arr[key] = {
      "default": default_value,
      "hash": valuehash
    };
    return this;
  };

  _Res.prototype.get = function(key) {
    var entry = this.arr[key];
    if( entry == null ) {
      return null;
    }
    var hash = entry["hash"];
    if( hash != null && this.lc != null && this.lc in hash ) {
      return hash[this.lc];
    }
    return entry["default"];
  };

  _Res.prototype.locale = function(lc) {
    if(arguments != null && arguments.length >= 1 ) {
      this.lc = lc;
      return this;
    }
    else {
      return this.lc;
    }
  };


  // ================================ Initialization
  M.G = {
    "url": new M.Url(document && document.URL ? document.URL : null),
    "res": new _Res(),
    "ua": new _UserAgent()
  };

  // BO.G.url.params(key,value)
  // BO.G.res.get(key)
  // BO.G.res.put(key, default_value, valuehash)
  BO.G.res.put("open", "Open", {"ja": "開く"});
  BO.G.res.put("close", "Close", {"ja": "閉じる"});
  BO.G.res.put("mylocation", "My Location", {"ja": "現在位置"});
  BO.G.res.put("permalink", "Permalink", {"ja": "永続リンク"});


  // ======================================== Geo
  {
    if( global["BO"]["geo"] == null ) {
      global["BO"]["geo"] = {};
    }
    var M = global["BO"]["geo"];

    M.createGeoLocation = function() {
      var geolocation = null;
      if( navigator != null ) {
        geolocation = navigator.geolocation;
      }
      if( geolocation == null &&
          window.google &&
          window.google.gears &&
          window.google.gears.factory &&
          window.google.gears.factory.create ) {
        geolocation = google.gears.factory.create("beta.geolocation");
      }
      return geolocation;
    };

    M.supportsGeoLocation = function() {
      return M.createGeoLocation() != null;
    }();

    M.findMyLocation = function(callback, opts) {
      var opts2 = {
        "timeout": 15000,
        "enableHighAccuracy": true
      };
      if( opts != null ) {
        for( var k in opts ) {
          opts2[k] = opts[k];
        }
      }
      var geolocation = M.createGeoLocation();
      if( geolocation == null ) {
        return false;
      }
      var fn_success, fn_error;
      if( callback != null ) {
        fn_success = function(_callback) {
          return function(location) {
            _callback(
              BO.ST_OK,
              {
                "lonlat": new BO.geo.lonlat(
                  location.coords.longitude,
                  location.coords.latitude
                ),
                "acc": location.coords.accuracy
              }
            );
          };
        }(callback);
        fn_error = function(_callback) {
          return function(err, _findMyLocation_Message) {
            var mess = null;
            switch( err != null ? err.code : 01 ) {
            case 1: // PERMISSION_DENIED
              mess = BO.G.res.get("err_mylocation_permissiondenied");
              break;
            case 2: // POSITION_UNAVAILABLE
              mess = BO.G.res.get("err_mylocation_unavialable");
              break;
            case 3: // TIMEOUT
              mess = BO.G.res.get("err_mylocation_timeout");
              break;
            }
            if( mess == null ) {
              mess = err.message;
            }
            if( mess == null ) {
              mess = BO.G.res.get("err_mylocation");
            }
            _callback(BO.ST_ERROR, mess);
          };
        }(callback);
      }
      else {
        fn_success = function() {};
        fn_error = function() {};
      }
      geolocation.getCurrentPosition(fn_success, fn_error, opts2);
      return true;
  };

    M.lonlat = function(lon, lat) {
      this.lon = lon;
      this.lat = lat;
    }
    M.lonlat.prototype.toString = function() {
      return this.lon + " " + this.lat;
    }

    BO.G.res.put(
      "err_mylocation_permissiondenied",
      "Position acquision permission denied.",
      {
        "ja": "現在位置取得が許可されませんでした。"
      }
    );
    BO.G.res.put(
      "err_mylocation_unavialable",
      "Position acquision device error.",
      {
        "ja": "現在位置取得デバイスでエラーが発生しした。"
      }
    );
    BO.G.res.put(
      "err_mylocation_timeout",
      "Position acquision timed out.",
      {
        "ja": "時間までに現在位置取得ができませんでした。"
      }
    );
    BO.G.res.put(
      "err_mylocation",
      "Cannot find my location.",
      {
        "ja": "現在位置を取得できません。"
      }
    );
  }
})((this || 0).self || global);
