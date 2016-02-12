(function(global) {
  if( global["MAIN"] == null ) {
    global["MAIN"] = {};
  }
  var M = global["MAIN"];

  // ================ Resources
  BO.G.res.put("fgd_s", "FGD", {"ja": "基盤地図"});
  BO.G.res.put("fgd", "Fundamental Geospatial Data", {"ja": "基盤地図情報"});
  BO.G.res.put("sunrise", "Sunrise", {"ja": "日出"});
  BO.G.res.put("sunset", "Sunset", {"ja": "日没"});
  BO.G.res.put("culmination", "Culmination", {"ja": "南中"});
  BO.G.res.put("time", "Time", {"ja": "時刻"});
  BO.G.res.put("azimuth", "Azimuth", {"ja": "方位"});
  BO.G.res.put("altitude", "Altitude", {"ja": "標高"});

  BO.G.res.put("whitenight", "White Night", {"ja": "白夜"});
  BO.G.res.put("polarnight", "Polar Night", {"ja": "極夜"});

  BO.G.res.put("cb_date", "Save Date", {"ja": "日付保存"});
  BO.G.res.put("cb_altitude", "Save Calculation Altitude",
    {"ja": "計算標高保存"});
  BO.G.res.put("cb_location", "Save Calculation Location",
    {"ja": "計算位置保存"});

  BO.G.res.put("b_clear", "Clear Calculation Location", {"ja": "計算位置消去"});

  BO.G.res.put("input_year", "Input Year", {"ja": "年を入力して下さい"});
  BO.G.res.put("input_altitude", "Input Altitude", {"ja": "標高を入力して下さい"});

  BO.G.res.put("f_date", "yyyy-MM-dd", {"ja": "yyyy年MM月dd日"});

  BO.G.res.put("openstreetmap", "OpenStreetMap", {"ja": "OpenStreetMap"});
  BO.G.res.put("osm", "OSM", {"ja": "OSM"});
  BO.G.res.put("osm_credit", "(C) OpenStreetMap contributors", {"ja": "(C) OpenStreetMap contributors"});

  BO.G.res.put("months",
    [
      "Jan", "Feb", "Mar", "Apr", "May",
      "Jun", "Jul", "Aug", "Sep", "Oct",
      "Nov", "Dec"
    ],
    {"ja":[
      "1月", "2月", "3月", "4月", "5月",
      "6月", "7月", "8月", "9月", "10月",
      "11月", "12月"
    ]}
  );

  var timezones = [
    {'text': '+14:00', 'value': 14},
    {'text': '+13:00', 'value': 13},
    {'text': '+12:45', 'value': 12.75},
    {'text': '+12:00', 'value': 12},
    {'text': '+11:30', 'value': 11.5},
    {'text': '+11:00', 'value': 11},
    {'text': '+10:30', 'value': 10.5},
    {'text': '+10:00', 'value': 10},
    {'text': '+9:30', 'value': 9.5},
    {'text': '+9:00', 'value': 9},
    {'text': '+8:45', 'value': 8.75},
    {'text': '+8:00', 'value': 8},
    {'text': '+7:00', 'value': 7},
    {'text': '+6:30', 'value': 6.5},
    {'text': '+6:00', 'value': 6},
    {'text': '+5:45', 'value': 5.75},
    {'text': '+5:30', 'value': 5.5},
    {'text': '+5:00', 'value': 5},
    {'text': '+4:30', 'value': 4.5},
    {'text': '+4:00', 'value': 4},
    {'text': '+3:30', 'value': 3.5},
    {'text': '+3:00', 'value': 3},
    {'text': '+2:00', 'value': 2},
    {'text': '+1:00', 'value': 1},
    {'text': '(UTC)', 'value': 0},
    {'text': '-1:00', 'value': -1},
    {'text': '-2:00', 'value': -2},
    {'text': '-3:00', 'value': -3},
    {'text': '-3:30', 'value': -3.5},
    {'text': '-4:00', 'value': -4},
    {'text': '-4:30', 'value': -4.5},
    {'text': '-5:00', 'value': -5},
    {'text': '-6:00', 'value': -6},
    {'text': '-7:00', 'value': -7},
    {'text': '-8:00', 'value': -8},
    {'text': '-9:00', 'value': -9},
    {'text': '-9:30', 'value': -9.5},
    {'text': '-10:00', 'value': -10},
    {'text': '-11:00', 'value': -11},
    {'text': '-12:00', 'value': -12}
  ];

  // ================ Constants
  var R = 6378137.0; // Radius of earth on EPSG:3857
  var DEFAULT_ZOOM = 4;

  // ================ Utils
  function filterMembers(obj, list) {
    var ret = {};
    if( obj != null ) {
      for(var k in obj) {
        // Checks whether k is listed.
        // IE 8 has NOT Array.prototype.indexOf
        var found = false;
        if( list != null ) {
          var len = list.length;
          for(var n = 0; found == false && n < len; n++ ) {
            if( list[n] == k ) {
              // found
              found = true;
            }
          }
        }
        // If k is not found in the list, sets value.
        // If k is not found in the list, goes through.
        if( found === false ) {
          ret[k] = obj[k];
        }
      }
    }
    return ret;
  }

  function extractMembers(obj, list) {
    var ret = {};
    if( obj != null ) {
      var len = list != null ? list.length : 0;
      for(var n = 0; n < len; n++ ) {
        var k = list[n];
        ret[k] = obj[k];
      }
    }
    return ret;
  }

  function mergeMembers() {
    var ret = {};
    var len_arg = arguments != null ? arguments.length : 0;
    for(var n_arg = 0; n_arg < len_arg; n_arg++ ) {
      var arg = arguments[n_arg];
      if( arg != null ) {
        for(var k in arg ) {
          ret[k] = arg[k];
        }
      }
    }
    return ret;
  }

  function anotherPoint(latlng, dist, azim) {
    var rad = azim * Math.PI / 180.0;
    // latlng -> ux,uy
    var ux1 = R * latlng.lng() * Math.PI / 180.0;
    var uy1 = R * Math.log(Math.tan(0.25*Math.PI + latlng.lat()*Math.PI/360.0));
    // another ux,uy
    var ux2 = ux1+dist*Math.sin(rad);
    var uy2 = uy1+dist*Math.cos(rad);
    // another latlng
    // tanh is not available on IE !!!
//    return new google.maps.LatLng(
//      Math.asin(Math.tanh(uy2/R)) / Math.PI * 180.0,
//      ux2 / R / Math.PI * 180.0
//    );
    return new google.maps.LatLng(
      (2.0*Math.atan(Math.exp(uy2/R))-0.5*Math.PI) / Math.PI * 180.0,
      ux2 / R / Math.PI * 180.0
    );
  }

  // ================ TMS MapType
  // OSMMap
  function OSMMapType() {
  }
  OSMMapType.prototype.tileSize = new google.maps.Size(256,256);
  OSMMapType.prototype.maxZoom = 17;
  OSMMapType.prototype.name =  BO.G.res.get("osm");
  OSMMapType.prototype.alt = BO.G.res.get("openstreetmap");
  OSMMapType.prototype.getTile = function(tile, zoom, ownerDocument) {
    var tw = 1 << zoom;
    var tx = tile.x;
    var ty = tile.y;
    // enforces tx to [0,tw]
    tx = tx - Math.floor(tx/tw)*tw;
    // checks out of world
    if( ty < 0 || ty >= tw ) {
      // out of world.
      var div = ownerDocument.createElement("div");
      div.style.width = this.tileSize.width + "px";
      div.style.height = this.tileSize.height + "px";
      return div;
    }
    else {
      // inside.
      var img = ownerDocument.createElement("img");
      img.style.width = this.tileSize.width + "px";
      img.style.height = this.tileSize.height + "px";
      img.src = "http://tile.openstreetmap.org/"
        + zoom + "/" + tx + "/" + tile.y + ".png";
      return img;
    }
  };
  OSMMapType.prototype.credit = function() {
    return BO.G.res.get("osm_credit");
  };

  // ================ InfoWindow
  var infowindow = null;
  // Closes InfoWindow
  function closeInfoWindow() {
    if( infowindow != null ) {
      infowindow.close();
    }
  }
  // 
  function showInfoWindow(map, latlng, event) {
    closeInfoWindow();
    if( infowindow == null ) {
      infowindow = new google.maps.InfoWindow({"disableAutoPan": true});
    }
    var name, time, azim;
    if( event.typecode == SolarPosition.TC_DAYTIME &&
        event.boundarycode == 1 ) {
      name = BO.G.res.get("sunrise");
    }
    else if( event.typecode == SolarPosition.TC_DAYTIME &&
        event.boundarycode == -1 ) {
      name = BO.G.res.get("sunset");
    }
    time = event.time.toString("hh:mm");
//    azim = parseInt(event.azimuth);
    azim = Math.round(event.azimuth*10.0)/10.0;
    infowindow.setContent(
      "<pre style=\"margin: 0; padding: 0.25em;\">" +
      name + "\n" +
      BO.G.res.get("time") + ": " + time + "\n" +
      BO.G.res.get("azimuth") + ": " + azim + "</pre>"
    );
    infowindow.setPosition(latlng);
    infowindow.open(map);
  };

  function Permalink(url, root) {
    this.url = new BO.Url(url.toString());
    this.params = this.url.params;
    if( this.params == null ) {
      this.params = {};
    }
    this.e = {};
    this.e.root = root;
    // (p1)
    var p1 = document.createElement("p");
    this.e.root.appendChild(p1);
    // (p1)/a
    this.e.a = document.createElement("a");
    p1.appendChild(this.e.a);
    this.e.a.target = "_blank";
    this.e.a.href = "javascript:void(0)";
    // (p2)
    var p2 = document.createElement("p");
    this.e.root.appendChild(p2);
    // (p2)/cb_date, cb_altitude, cb_location
    var arr = ["cb_date", "cb_altitude", "cb_location"];
    for( var n = 0; n < arr.length; n++ ) {
      var k = arr[n];
      var span = document.createElement("span");
      span.className = "cell";
      p2.appendChild(span);
      span.appendChild(document.createTextNode(BO.G.res.get(k)));
      var cb = document.createElement("input");
      cb.type = "checkbox";
      span.appendChild(cb);
      this.e[k] = cb;
      cb.onchange = function(_this) {
        return function() {
          _this.createAnchor();
        }
      }(this);
      // IE8 onchange event fired after blur event.
      if( BO.G.ua.isIE8OrLess() ) {
        cb.onclick = function(_cb) {
          return function() {
            _cb.blur();
            _cb.focus();
          };
        }(cb);
      }
    }
    // (p3)
    var p3 = document.createElement("p");
    this.e.root.appendChild(p3);
    this.e.close = document.createElement("button");
    p3.appendChild(this.e.close);
    this.e.close.appendChild(document.createTextNode(BO.G.res.get("close")));
    this.e.close.onclick = function(_this) {
      return function() {
        _this.e.root.style.display = "none";
      };
    }(this);
    //
  };

  Permalink.prototype.put = function(key, value) {
    if( key != null ) {
      if( value == null ) {
        delete this.params[key];
      }
      else {
        this.params[key] = value;
      }
      this.createAnchor();
    }
  };


  Permalink.prototype.show = function() {
    this.createAnchor();
    this.e.root.style.display = "block";
  }

// lon, lat, zoom, mt, cy, cm, cd, cz, ca, clon, clat
  Permalink.prototype.createAnchor = function() {
    var filter = [];
    //
    if( !this.e.cb_date.checked ) {
      filter.push("cy");
      filter.push("cm");
      filter.push("cd");
      filter.push("cz");
    }
    if( !this.e.cb_altitude.checked ) {
      filter.push("ca");
    }
    if( !this.e.cb_location.checked ) {
      filter.push("clon");
      filter.push("clat");
    }
    var params = filterMembers(this.params, filter);
    // clears a
    var a = this.e.a;
    while( a.firstChild ) {
      a.removeChild(a.firstChild);
    }
    var url = new BO.Url(this.url.body());
    if( params != null ) {
      for( var k in params ) {
        url.param(k, params[k]);
      }
    }
    var urltext = url.toString();
    this.e.a.href = urltext;
    this.e.a.appendChild(document.createTextNode(urltext));
  }


  // ======== mylocation
  function findMyLocation(map) {
    BO.geo.findMyLocation(
      function(st, app) {
        if( st == BO.ST_OK ) {
          // got
          var latlng = new google.maps.LatLng(
            app.lonlat.lat,
            app.lonlat.lon
          );
          map.setCenter(latlng);
          var circle = addGeom(
            map,
            "circle",
            {
              "strokeColor": "#0099ff",
              "strokeOpacity": 1.0,
              "strokeWeght": 1.0,
              "fillColor": "#0099ff",
              "fillOpacity": 0.6,
              "radius": app.acc,
              "center": latlng
            }
          );
          setTimeout(function(){circle.setMap(null);}, 5000);
        }
        else {
          // error
          alert(app);
        }
      }
    );
  }

  // ================ Geometry
  function addGeom(map, type, opts) {
    var geom = null;
    switch(type) {
    case "circle":
      geom = new google.maps.Circle(opts);
      geom.setMap(map);
      return geom;
    case "linestring":
      geom = new google.maps.Polyline(opts);
      geom.setMap(map);
      return geom;
    case "arc":
      return new arc(map, opts);
    }
    return null;
  }

  function arc(map, opts) {
    var dd = 10; // 8arcs/quad
    // arc specific options
    var center = opts["center"];
    var radius = opts["radius"];
    // Degrees
    var d1 = opts["startDegree"];
    var d2 = opts["endDegree"];
    // Deletes arc specific options
    opts = filterMembers(
      opts,
      ["center", "radius", "startDegree", "endDegree"]
    );
    // within [0,360)
    d1 = d1 - Math.floor(d1/360.0) * 360.0;
    d2 = d2 - Math.floor(d2/360.0) * 360.0;
    // Overs 0[deg] line.
    if( d1 > d2 ) {
      d2 = d2 + 360.0;
    }
    // Creates path for filled.
    var path = [center];
    for( var d = d1; d < d2; d = d + dd) {
      if( d + dd >= d2 ) {
        // last point
        d = d2;
      }
      // Adds to path
      path.push(anotherPoint(center, radius, d));
    }
    // end
    path.push(center);
    // polygon without line
    var optsp = mergeMembers(
        {
          "clickable": false,
          "draggable": false,
          "editable": false,
          "geodesic": false
        },
        opts,
        {
          "paths": [path],
          "map": map,
          "strokeColor": opts["fillColor"],
          "strokeOpacity": 0,
          "strokeWeight": 0
        }
    );
    this.polygon = new google.maps.Polygon(optsp);
    // line
    if( "strokeColor" in opts && "strokeWeight" in opts ) {
      var pathl = path.slice(1, -1);
      var optsl = filterMembers(
        mergeMembers(
          {
            "clickable": false,
            "draggable": false,
            "editable": false,
            "geodesic": false
          },
          opts,
          {
            "path": pathl,
            "map": map
          }
        ),
        ["fillColor", "fillOpacity"]
      );
      this.linestring = new google.maps.Polyline(optsl);
    }
  };
  arc.prototype.setMap = function(map) {
    if( this.polygon != null ) {
      this.polygon.setMap(map);
    }
    if( this.linestring != null ) {
      this.linestring.setMap(map);
    }
  };

  //
  // Calculator
  //
  function Calculator(map, ey, em, ed, ea, ez, eres) {
    this.map = map;
    this.ey = ey;
    this.em = em;
    this.ed = ed;
    this.ea = ea;
    this.ez = ez;
    this.eres = eres;
    this.geoms = [];
    this.onmove = null;
  }

  Calculator.prototype.clearResult = function() {
    while( this.eres.firstChild ) {
      this.eres.removeChild(this.eres.firstChild);
    }
  };

  Calculator.prototype.clearGeoms = function() {
    for(var n = 0; n < this.geoms.length; n++ ) {
      if( this.geoms[n] ) {
        this.geoms[n].setMap(null);
      }
    }
    this.geoms = [];
  };

  // days of each month
  var mdays = [31,28,31,30,31,30,31,31,30,31,30,31];

  Calculator.prototype.calculate = function() {
    // clear result
    this.clearResult();
    this.clearGeoms();
    // check
    if( this.latlng == null ) {
      // leaves without any message
      return false;
    }
    // gets params
    var y = this.ey.value * 1;
    var m = this.em.value * 1;
    var d = this.ed.value * 1;
    var a = this.ea.value * 1.0;
    var z = this.ez.value * 1.0;
    // y,m,d check
    if( !(y >= 2000) ) {
      this.ey.value = 2000;
      y = 2000;
    }
    if( m < 0 ) {
      this.em.value = 0;
      m = 0;
    }
    else if( m > 11 ) {
      this.em.value = 11;
      m = 11;
    }
    if( d < 1 ) {
      this.ed.value = 1;
      d = 1;
    }
    else {
      var lastday = mdays[m];
      if( m == 1 && (y % 4 == 0 && ( y % 100 != 0 || y % 400 == 0 ) ) ) {
        lastday++;
      }
      if( d > lastday ) {
        this.ed.value = lastday;
        d = lastday;
      }
    }
    if( isNaN(a) ) {
      this.ea.value = 0;
      a = 0;
    }
    //
    var date = new SolarPosition.Date(y, m, d, 0, 0, 0, 0, z );
    var res = SolarPosition.calculateStatusSeries(
      date,
      {"lon": this.latLng().lng(), "lat": this.latLng().lat()},
      a, // elv
      60.0 // dt=60[sec]
    );
    var event = res["event"];
    var sunrise = null;
    var sunset = null;
    var culmination = null;
    var filtered = [];
    for(var n = 0; n < event.length; n++) {
      var ev = event[n];
      if( ev.typecode == SolarPosition.TC_DAYTIME &&
          ev.boundarycode == 1) {
        sunrise = ev;
        filtered.push(ev);
      }
      else if( ev.typecode == SolarPosition.TC_DAYTIME &&
          ev.boundarycode == -1 ) {
        sunset = ev;
        filtered.push(ev);
      }
      else if( ev.typecode == SolarPosition.TC_CULMINATION ) {
        culmination = ev;
        filtered.push(ev);
      }
    }
    this.createResult(date, a, res.first.typecode, filtered);
    this.createGeoms(sunrise, sunset, culmination);
  };

  Calculator.prototype.latLng = function() {
    var ac = arguments != null ? arguments.length : 0;
    if( ac >= 1 ) {
      // setter
      this.latlng = arguments[0];
      this.calculate();
      if( this.onmove != null ) {
        this.onmove();
      }
      return this;
    }
    // getter
    return this.latlng;
  };

  Calculator.prototype.createEmptySubResult = function(firstTypeCode) {
    var span = document.createElement("span");
    span.className = "cell";
    span.appendChild(document.createTextNode(
      firstTypeCode == SolarPosition.TC_DAYTIME ?
        BO.G.res.get("whitenight") :
        BO.G.res.get("polarnight")
    ));
    this.eres.appendChild(span);
  };

  Calculator.prototype.createResult = function(date, alti, firstTypeCode, events) {
    this.clearResult();
    // date
    var text = date.toString(BO.G.res.get("f_date")) + "(" +
      (date.tz == 0 ? "UTC" : date.toString("z")) +") " +
      BO.G.res.get("altitude")+" "+alti+"m";
    var span = document.createElement("span");
    span.className = "cell";
    span.appendChild(document.createTextNode(text));
    this.eres.appendChild(span);
    // Checks whether sunrise or sunset event is in the list.
    var len = events != null ? events.length : 0;
    if( !(len > 0) ) {
      // no event
      this.createEmptySubResult(firstTypeCode);
      return;
    }
    if( len == 1 && events[0].typecode == SolarPosition.TC_CULMINATION ) {
      // only culmination
      this.createEmptySubResult(firstTypeCode);
    }
    // Prints events.
    for( var n = 0; n < len; n++ ) {
      var event = events[n];
      var time = event.time.toString("hh:mm");
      var azim = Math.round(event.azimuth*10.0)/10.0;
      var text;
      if( event.typecode == SolarPosition.TC_DAYTIME &&
          event.boundarycode == 1 ) {
        text = BO.G.res.get("sunrise")+"-"+time+" ("+azim+")";
      }
      else if( event.typecode == SolarPosition.TC_DAYTIME &&
          event.boundarycode == -1 ) {
        text = BO.G.res.get("sunset")+"-"+time+" ("+azim+")";
      }
      else if( event.typecode == SolarPosition.TC_CULMINATION ) {
        text = BO.G.res.get("culmination")+"-"+time;
      }
      var span = document.createElement("span");
      span.className = "cell";
      span.appendChild(document.createTextNode(text));
      this.eres.appendChild(span);
    }
  };

  Calculator.prototype.createGeoms = function(sunrise, sunset, culmination) {
    this.clearGeoms();
    var latlng = this.latLng();
    var radius = 50000.0; // Distance of lines and Radius of arc.
    // arc
    if( sunrise != null && sunset != null && culmination != null) {
      var d1, d2;
      if( culmination.azimuth > 90 && culmination.azimuth < 270 ) {
        // east->south->west
        d1 = sunrise.azimuth;
        d2 = sunset.azimuth;
      }
      else {
        // west->north->east
        d1 = sunset.azimuth;
        d2 = sunrise.azimuth;
      }
      var geom = addGeom(
        this.map,
        "arc",
        {
          "center": latlng,
          "radius": radius,
          "startDegree": d1,
          "endDegree": d2,
          "fillColor": "#ffc",
          "fillOpacity": 0.4
        }
      );
      this.geoms.push(geom);
    }
    // calmination
    if( culmination != null ) {
      var geom = addGeom(
        this.map,
        "linestring",
        {
        "clickable": false,
          "path": [
            latlng,
            anotherPoint(
              latlng,
              radius,
              culmination.azimuth
            )
          ],
          "strokeColor": "#990",
          "strokeWeight": 3
        }
      );
      this.geoms.push(geom);
    }
    // Backward/sunrise
    if( sunrise != null ) {
      createBackwardLine(
        this.geoms,
        this.map,
        latlng,
        sunrise,
        radius,
        "#900"
      );
    }
    // Backward/sunset
    if( sunset != null ) {
      createBackwardLine(
        this.geoms,
        this.map,
        latlng,
        sunset,
        radius,
        "#009"
      );
    }

    // Forward/sunrise
    if( sunrise != null ) {
      createForwardLine(
        this.geoms,
        this.map,
        latlng,
        sunrise,
        radius,
        "#f00"
      );
    }
    // Forward/sunset
    if( sunset != null ) {
      createForwardLine(
        this.geoms,
        this.map,
        latlng,
        sunset,
        radius,
        "#00f"
      );
    }
  }

  /**
   * Creates forward line and adds map and geoms.
   * Called by Calculator::createGeom().
   * @param geoms Array of geometries.
   * @param map GMap.
   * @param latlng LatLng of calucation location.
   * @param sev SolarMotion Event.
   * @param dist Distance of line [m].
   * @param color Color of line.
   */
  function createForwardLine(geoms, map, latlng, sev, dist, color) {
    // Forward
    var geom1 = addGeom(
      map,
      "linestring",
      {
        "clickable": true,
        "path": [
          latlng,
          anotherPoint(
            latlng,
            dist,
            sev.azimuth
          )
        ],
        "strokeColor": color,
        "strokeWeight": 3
      }
    );
    // Forward:mouseover
    google.maps.event.addListener(
      geom1,
      "mouseover",
      function(gev) {
        showInfoWindow(map, gev.latLng, sev);
      }
    );
    google.maps.event.addListener(
      geom1,
      "mouseout",
      closeInfoWindow
    );
    geoms.push(geom1);
  }

  /**
   * Creates backward line and adds map and geoms.
   * Called by Calculator::createGeom().
   * @param geoms Array of geometries.
   * @param map GMap.
   * @param latlng LatLng of calucation location.
   * @param sev SolarMotion Event.
   * @param dist Distance of line [m].
   * @param color Color of line.
   */
  function createBackwardLine(geoms, map, latlng, sev, dist, color) {
    // Backward
    var geom2 = addGeom(
      map,
      "linestring",
      {
        "clickable": false,
        "path": [
          latlng,
          anotherPoint(
            latlng,
            dist,
            sev.azimuth + 180.0
          )
        ],
        "strokeColor": color,
        "strokeWeight": 1
      }
    );
    geoms.push(geom2);
  };

  // Iniailizes the map.
  function createGMap(e, center, zoom, mapId, maps) {
    var mapopts = {
      "center": center,
      "zoom": zoom
    };
    if( mapId != null ) {
      mapopts.mapTypeId = mapId;
    }
    var mapTypeIds = [];
    var mapTypes = [];
    var mapCredits = {};
    if( maps ) {
      for( var n = 0; n < maps.length; n++ ) {
        var m = maps[n];
        if( m != null ) {
          var id = m["id"];
          mapTypes.push(m);
          mapTypeIds.push(id);
          // sets up credit
          if( m.credit != null ) {
            mapCredits[id] = m.credit;
          }
          if( m.type.credit != null ) {
            if( typeof m.type.credit == "function" ) {
               mapCredits[id] = m.type.credit();
            }
            else {
              mapCredits[id] = m.type.credit;
            }
          }
        }
      }
    }
    mapTypeIds.push(google.maps.MapTypeId.ROADMAP);
    mapTypeIds.push(google.maps.MapTypeId.SATELLITE);
    mapopts["mapTypeControlOptions"] = {
      "mapTypeIds": mapTypeIds
    };
    map = new google.maps.Map(e, mapopts);
    for( var n = 0; n < mapTypes.length; n++ ) {
      map.mapTypes.set(m["id"],m["type"]);
    }
    // Custom credit
    var e_credit = document.createElement("div");
    e_credit.className = "gm-style";
    e_credit.style.position = "relative";
    var e_credit_bg = document.createElement("div");
    e_credit.appendChild(e_credit_bg);
    e_credit_bg.className = "credit-bg";
    e_credit_bg.style.position = "absolute";
    e_credit_bg.style.left = "0";
    e_credit_bg.style.top = "0";
    e_credit_bg.style.width = "100%";
    e_credit_bg.style.height = "100%";
    e_credit_bg.style.opacity = "0.7";
    e_credit_bg.style.zIndex  = 1000;
    var e_credit_fg = document.createElement("div");
    e_credit.appendChild(e_credit_fg);
    e_credit_fg.className = "credit-fg";
    e_credit_fg.style.position = "relative";
    e_credit_fg.style.left = "0";
    e_credit_fg.style.top = "0";
    e_credit_fg.style.zIndex  = 1001;
    map.controls[google.maps.ControlPosition.BOTTOM_RIGHT].push(e_credit);
    google.maps.event.addListener(map, "maptypeid_changed", function() {
      // clears first
      while( e_credit_fg.firstChild ) {
        e_credit_fg.removeChild(e_credit_fg.firstChild);
      }
      var mt = map.getMapTypeId();
      if( mapCredits[mt] != null ) {
        e_credit_fg.appendChild(document.createTextNode(mapCredits[mt]));
        e_credit.style.display = "block";
        e_credit_bg.style.width = e_credit_fg.clientWidth + "px";
        e_credit_bg.style.height = e_credit_fg.clientHeight + "px";
      }
      else {
        e_credit.style.display = "none";
      }
    });

    return map;
  };

  //
  // Initialization (external)
  //
  M.init = function() {
    // today
    var today = new SolarPosition.Date();
    // top
    var etop = document.getElementById("TOP");
    // top/p1
    var p1 = document.createElement("p");
    p1.className = "topinput";
    etop.appendChild(p1);
    // top/p1/ymd
    // top/p1/ymd/y
    var span = document.createElement("span");
    span.className = "cell";
    p1.appendChild(span);
    var ey = document.createElement("input");
    span.appendChild(ey);
    ey.type = "text";
    ey.size = "4";
    // top/p1/ymd/m
    var em = document.createElement("select");
    span.appendChild(em);
    // top/p1/ymd/d
    var ed = document.createElement("select");
    span.appendChild(ed);
    // top/p1/ymd/z
    var ez = document.createElement("select");
    span.appendChild(ez);
    // top/p1/a
    var span = document.createElement("span");
    span.className = "cell";
    p1.appendChild(span);
    var ea = document.createElement("input");
    span.appendChild(ea);
    ea.type = "text";
    ea.size = "4";
    span.appendChild(document.createTextNode("m"));
    // top/p2
    var p2 = document.createElement("p");
    p2.className = "topinput";
    etop.appendChild(p2);
    var b_permalink = document.createElement("button");
    p2.appendChild(b_permalink);
    b_permalink.appendChild(document.createTextNode(BO.G.res.get("permalink")));
    var b_clear = document.createElement("button");
    p2.appendChild(b_clear);
    b_clear.appendChild(document.createTextNode(BO.G.res.get("b_clear")));
    var b_mylocation = document.createElement("button");
    p2.appendChild(b_mylocation);
    b_mylocation.appendChild(
      document.createTextNode(BO.G.res.get("mylocation"))
    );

    if( BO.G.ua.mobile ) {
      var gen = function(e, k) {
        return function() {
          var r = window.prompt(BO.G.res.get(k), e.value);
          if( r != null ) {
            e.value = r;
          }
          e.blur();
        };
      };
      ey.onclick = gen(ey, "input_year");
      ea.onclick = gen(ea, "input_altitude");
    }

    // RES
    var eres = document.createElement("p");
    etop.appendChild(eres);
    eres.id = "RESULT";

    // creates em
    var months = BO.G.res.get("months");
    for(var n = 0; n < months.length; n++ ) {
      var opt = document.createElement("option");
      em.appendChild(opt);
      opt.value = n;
      opt.appendChild(document.createTextNode(months[n]));
    }
    // creates ed
    for(var n = 1; n <= 31; n++ ) {
      var opt = document.createElement("option");
      ed.appendChild(opt);
      opt.value = n;
      opt.appendChild(document.createTextNode(""+n));
    }
    // creates ez
    for(var n = 0; n < timezones.length; n++ ) {
      var tz = timezones[n];
      if( tz != null ) {
        var opt = document.createElement("option");
        ez.appendChild(opt);
        opt.value = tz["value"];
        opt.appendChild(document.createTextNode(tz["text"]));
      }
    }
    // Initializes ey, em, ed
    if( BO.G.url.param("cy") != null &&
        BO.G.url.param("cm") != null &&
        BO.G.url.param("cd") != null ) {
      ey.value = BO.G.url.param("cy") * 1;
      em.value = BO.G.url.param("cm") * 1;
      ed.value = BO.G.url.param("cd") * 1;
    }
    else {
      // default values
      ey.value = today.year;
      em.value = today.month;
      ed.value = today.mday;
    }
    // Initializes ez
    if( BO.G.url.param("cz") != null ) {
      ez.value = BO.G.url.param("cz") * 1.0;
    }
    else {
      ez.value = today.tz;
    }
    // Iniaializes ea
    if( BO.G.url.param("ca") != null ) {
      ea.value = BO.G.url.param("ca") * 1.0;
    }
    else {
      ea.value = "1.5";
    }
    // MAIN
    var e_main = document.getElementById("MAIN");
    // MAIN/MAP
    var e_map = document.createElement("div");
    e_main.appendChild(e_map);
    e_map.style.position = "absolute";
    e_map.style.top = "0";
    e_map.style.left = "0";
    e_map.style.width = "100%";
    e_map.style.height = "100%";
    var lnglat = new google.maps.LatLng(35, 135);
    var zoom = DEFAULT_ZOOM;
    if( BO.G.url.param("lon") != null && BO.G.url.param("lat") != null ) {
      lnglat = new google.maps.LatLng(
        BO.G.url.param("lat") * 1.0,
        BO.G.url.param("lon") * 1.0
      );
      if( BO.G.url.param("zoom") != null ) {
        zoom = BO.G.url.param("zoom") * 1;
      }
    }
    var map = createGMap(
      e_map,
      lnglat,
      zoom,
      BO.G.url.param("mt"),
      [
        {"id": "OSM", "type": new OSMMapType()}
      ]
    );
    // MAIN/PERMALINK
    var e_permalink = document.createElement("div");
    e_permalink.id = "PERMALINK";
    e_main.appendChild(e_permalink);
    // document.getElementById("PERMALINK");
    e_permalink.style.display = "none";

    // Calculator
    var calculator = new Calculator(map, ey, em, ed, ea, ez, eres);
    // permalink
    var permalink = new Permalink(BO.G.url, e_permalink);

    // calculate if parameters are specified.
    if( BO.G.url.param("clon") != null && BO.G.url.param("clat") != null ) {
      calculator.latLng(new google.maps.LatLng(
        BO.G.url.param("clat") * 1.0,
        BO.G.url.param("clon") * 1.0
      ));
    }
    // sets the function to chage the permalink
    // when parameters of calculator are changed.
    calculator.onmove = function() {
      var latlng = calculator.latLng();
      if( latlng != null ) {
        permalink.put("clon", latlng.lng());
        permalink.put("clat", latlng.lat());
      }
      else {
        permalink.put("clon", null);
        permalink.put("clat", null);
      }
    };

    // Initializes parmalink
    // Following statements must be executed after calculator is created.
    var latlng = map.getCenter();
    permalink.put("mt", map.getMapTypeId());
    permalink.put("zoom", map.getZoom());
    permalink.put("lon", latlng.lng());
    permalink.put("lat", latlng.lat());
    permalink.put("cy", ey.value);
    permalink.put("cm", em.value);
    permalink.put("cd", ed.value);
    permalink.put("ca", ea.value);
    permalink.put("cz", ez.value);

    // EVENTS
    // map clicked
    google.maps.event.addListener(map, "click", function(mapevent) {
      var latlng = mapevent.latLng;
      calculator.latLng(latlng);
      calculator.calculate();
      permalink.put("clon", latlng.lng());
      permalink.put("clat", latlng.lat());
    });
    // maptypeid_changed
    map.addListener("maptypeid_changed", function() {
      permalink.put("mt", map.getMapTypeId());
    });
    // center_changed
    map.addListener("center_changed", function() {
      var latlng = map.getCenter();
      permalink.put("lon", latlng.lng());
      permalink.put("lat", latlng.lat());
    });
    // zoom_changed
    map.addListener("zoom_changed", function() {
      permalink.put("zoom", map.getZoom());
    });
    // resize event
    var onresize;
    if( BO.G.ua.isIE8OrLess() ) {
      // IE 7 or less does not have window.innerHeight.
      onresize = function() {
        var h1 = document.getElementById("TOP").offsetHeight;
        var wh = document.documentElement.offsetHeight;
        document.getElementById("MAIN").style.height = (wh - h1) + "px";
      };
    }
    else {
      onresize = function() {
        var h1 = etop.offsetHeight;
        var wh = window.innerHeight;
        document.getElementById("MAIN").style.height = (wh - h1) + "px";
      };
    }
    google.maps.event.addDomListener(window, "resize", onresize);
    // events for inputs (change)
    var arr = [ey, em, ed, ez, ea];
    var arr_pkey = ["cy", "cm", "cd", "cz", "ca"];
    for(var n = 0; n < arr.length; n++ ) {
      var e = arr[n];
      var k = arr_pkey[n];
      var v = BO.G.url.param(k);
      if( v != null ) {
        e.value = v;
      }
      e.onchange = function(_k, _e) {
        return function() {
          calculator.calculate();
          permalink.put(_k, _e.value);
        };
      }(k, e);
    }
    // mylocation clicked event
    b_mylocation.onclick = function() {
      findMyLocation(map);
    };
    // clear clicked -> clears calculation location
    b_clear.onclick = function() {
      calculator.latLng(null);
    };
    // permalink
    b_permalink.onclick = function() {
      permalink.show();
    };
    // initialization
    setTimeout(onresize, 0);
  };

})((this || 0).self || global);

window.onload = MAIN.init;
