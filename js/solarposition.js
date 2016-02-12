
//
// Solar Position
//
// REF: NAGASAWA Kou, Calculation of Sunrise and Sunset, Chijinshokan, 1999
//

//
// SolarPosition.calculate(date, pos)
//   date - Native Date, which includes Y,M,D,h,m,s,ms,tz
//   pos - Object, which includes "lat" and "lon".
//
/*

  function testPosition() {
    var s = "";
    var date = new SolarPosition.Date();
    for( var h = 0; h < 24; h++ ) {
      date.hours = h;
      date.minutes = 0;
      date.seconds = 0;
      date.milliseconds = 0;
      var res = SolarPosition.calculatePosition(date, {"lat": 35, "lon": 135});
      s = s + h + ": " + res.azimuth + " " + res.height + "\n";
    }
    var e = document.getElementById("MAIN");
    e.innerHTML = s;
  }

  function testSunriseSunset() {
    var date = new SolarPosition.Date(2015,10,24,0,0,0,0,12);
    var dtsec = 60;
    var elv = 3;
    var pos = {"lon": 135, "lat": 35};
    var res = SolarPosition.calculateStatusSeries(date, pos, elv, dtsec);
    var s = res.first.type + "\n";
    var event = res["event"];
    for(var n = 0; n < event.length; n++ ) {
      s = s + event[n].time + " " + event[n].boundary + " " + event[n].type + " "+
        event[n].azimuth + " " + event[n].altitude + "\n";
    }
    var e = document.getElementById("MAIN");
    e.innerHTML = s;
  }
*/

(function(global) {
  if( global["SolarPosition"] == null ) {
    global["SolarPosition"] = {};
  }

  var M = global["SolarPosition"];

  // internal constatnts
  // Radius/Degree
  var rpd = Math.PI / 180.0;
  // Degree/Radius
  var dpr = 180.0 / Math.PI;

  // Semidiameter of sun [deg] (視半径)
  M.Semidiameter = 16.0/60.0+1.18/3600.0;
  // Atmospheric Refraction [deg] (大気差)
  M.AtmosphericRefraction = 35.0/60.0+8.0/3600.0;
  // Event code: Night
  M.TC_NIGHT = 0;
  // Event code: Astronomical twilight
  M.TC_ASTRONOMICAL = 1;
  // Event code: Naval twilight
  M.TC_NAVAL = 2;
  // Event code: Civil twilight
  M.TC_CIVIL = 3;
  // Event code: Daytime
  M.TC_DAYTIME = 4;
  // Event code: Caumination
  M.TC_CULMINATION = 6;

  /**
   * Array of event texts.
   */
  var arr_status_text = [
    "night",
    "astronomical",
    "naval",
    "civil",
    "daytime",
    "",
    "culmination"
  ];
  /**
   * Date class.
   * Creates the instance meaning current datetime.
   */
  /**
   * Date class.
   * Creates the instance initialized with supplied Date instance.
   * @param date JavaScript Date instance for initialization.
   */
  /**
   * Date class.
   * Creates the instance initialized with supplied values.
   * @param year Year
   * @param month Month starting with 0.
   * @param mday (OPTIONAL) Day of month starting with 1.
   * @param hours (OPTIONAL) Hours.
   * @param minutes (OPTIONAL) Minutes.
   * @param seconds (OPTIONAL) Seconds.
   * @param milliseconds (OPTIONAL) Milliseconds.
   * @param tz (OPTIONAL) Time zone [hours]. For example, 9.0 means JTS (+09:00).
   */
  M.Date = function() {
    var ac = arguments != null ? arguments.length : 0;
    if( ac >= 2 ) {
      this.tz = ac >= 8 ?
        arguments[7] :
        -(new Date()).getTimezoneOffset() / 60.0;
      this.milliseconds = ac >= 7 ? arguments[6] : 0;
      this.seconds = ac >= 6 ? arguments[5] : 0;
      this.minutes = ac >= 5 ? arguments[4] : 0;
      this.hours = ac >= 4 ? arguments[3] : 0;
      this.mday = ac >= 3 ? arguments[2] : 1;
      this.month = ac >= 2 ? arguments[1] : 0;
      this.year = ac >= 2 ? arguments[0] : 1970;
      return;
    }
    else if( ac == 1 ) {
      if( arguments[0] instanceof Date ) {
        M.Date.call(
          this,
          arguments[0].getFullYear(),
          arguments[0].getMonth(),
          arguments[0].getDate(),
          arguments[0].getHours(),
          arguments[0].getMinutes(),
          arguments[0].getSeconds(),
          arguments[0].getMilliseconds(),
          -arguments[0].getTimezoneOffset() / 60.0
        );
        return;
      }
    }
    // Default
    M.Date.call(this, new Date());
  };

  /**
   * Creates Date instance from year, month, day, seconds of day [0-86400)
   * @param y Year
   * @param m Month starting with 0.
   * @param d Day of month starting with 1.
   * @param s Seconds of day [0-86400).
   */
  M.Date.fromYMDS = function(y, m, d, s, tz) {
    var ac = arguments != null ? arguments.length : 0;
    var ret = ac >= 4 ?
      new M.Date(y, m, d, 0, 0, 0, 0, tz) :
      new M.Date(y, m, d);
    ret.milliseconds = parseInt((s - Math.floor(s)) * 1000.0);
    s = parseInt(s);
    ret.seconds = s % 60;
    s = (s - ret.seconds) / 60;
    ret.minutes = s % 60;
    s = (s - ret.minutes) / 60;
    ret.hours = s % 24;
    s = (s - ret.hours) / 60;
    return ret;
  };

  // -------- Internal function for SolarPosition.Date
  // Available character for date format.
  var _Date_chars = "yMdhmsSz";

  /**
   * Integer to string with "0"s if digits of intval is less than cnt.
   * @param intval Integer value to be converted. Must not be negative.
   * @param cnt Length of returned string.
   * @return Converted string.
   */
  function _Date_itoa(intval, cnt) {
    var str = "" + parseInt(intval);
    var len = str.length;
    for( var n = len; n < cnt; n++ ) {
      str = "0" + str;
    }
    return str;
  }

  /**
   * Returned formatted member value.
   * @param date SolarPosition.Date instance.
   * @param sc Character of format.
   * @param sccnt Length of sc.
   * @return Converted string.
   */
  function _Date_format(date, sc, sccnt) {
    switch( sc ) {
    case "y": // year
      return _Date_itoa(date.year, sccnt);
    case "M": // mon
      return _Date_itoa(parseInt(date.month)+1, sccnt);
    case "d": // mday
      return _Date_itoa(date.mday, sccnt);
    case "h": // hours
      return _Date_itoa(date.hours, sccnt);
    case "m": // minutes
      return _Date_itoa(date.minutes, sccnt);
    case "s": // seconds
      return _Date_itoa(date.seconds, sccnt);
    case "S": // miliseconds
      // 0-999
      var frac = "" + (parseInt(date.miliseconds*1000)%100);
      for(var n = frac.length; n < sccnt; n++ ) {
        frac = frac + "0";
      }
      return frac;
    case "z":
      if( date.tz == 0 ) {
        return "Z";
      }
      else {
        var tz, tzpm;
        if( date.tz > 0 ) {
          tz = date.tz;
          tzpm = "+";
        }
        else {
          tz = -date.tz;
          tzpm = "-";
        }
        var tzm = parseInt(tz*60) % 60;
        var tzh = parseInt(tz);
        return tzpm +
          (tzh < 10 ? "0" : "")+tzh+ ":"+
          (tzm < 10 ? "0" : "")+tzm;
      }
      break;
    default:
      var ret = "";
      for(var n = 0; n < sccnt; n++ ) {
        ret = ret + sc;
      }
      return ret;
    }
  }

  /**
   * Converts into formatted text.
   * @param format Format. Available characters are following:
   *   y: Year
   *   M: Month (starting with 1)
   *   d: Day of month
   *   h: Hours
   *   m : Minuts
   *   s : Seconds
   *   S : Milliseconds
   *   z : Timezone ("Z" or /(-|+)[0-9]{2}:[0-9]{2}/)
   * Other charactes are passed thourgh.
   * Default format is "yyyy-MM-ddThh:mm:ss.SSSz"
   * @return Formatted text.
   */
  M.Date.prototype.toString = function() {
    var format;
    if( arguments != null && arguments.length > 0 ) {
      format = arguments[0];
    }
    else {
      format = "yyyy-MM-ddThh:mm:ss.SSSz";
    }
    var len = format.length;
    var st = 0;
    var scch;
    var sccnt;
    var ret = "";
    for( var n = 0; n < len; n++ ) {
      var ch = format.charAt(n);
      switch( st ) {
      case 0:
        if( ch == "\\" ) {
          // escape
          st = 1;
        }
        else if( _Date_chars.indexOf(ch) >= 0 ) {
          sc = ch;
          sccnt = 1;
          st = 2;
        }
        else {
          ret = ret + ch;
        }
        break;
      case 1: // escape
        ret = ret + ch;
        st = 0;
        break;
      case 2: // special chars
        if( ch == sc ) {
          sccnt++;
        }
        else {
          ret = ret + _Date_format(this, sc, sccnt);
          st = 0; // resets status
          n--; // back 1 char.
        }
        break;
      }
    }
    // rest
    switch( st ) {
    case 1: // escape
      ret = ret + "\\";
      break;
    case 2: // special chars
      ret = ret + _Date_format(this, sc, sccnt);
      break;
    }
    return ret;
  };

  /**
   * (INTERNAL) Calculates MJD.
   * @param y Gregorian year (local time).
   * @param m Gregorian month (local time) [0,11].
   * @param d Gregorian day of month (local time) [1,31].
   * @return MJD value.
   */
  function calcMJD(y, m, d) {
    if( m <= 1 ) {
      y = y - 1;
      m = m + 12;
    }
    return Math.floor(365.25*y)
      +Math.floor(y/400)
      -Math.floor(y/100)
      +Math.floor(30.59*(m-1))
      +d-678912;
  };

  /**
   * Calculates relative time [day]
   * based on J2000.0 TDB (Barycentric Dynamical Time)
   * @param y Gregorian year (local time)
   * @param m Gregorian month (local time), starting with 0.
   * @param d Gregorian day of month (local time), starting with 1.
   * @param tz Timezone [hour].
   * @return Relative time [day] based on J2000.0 TDB.
   */
  M.calculateRelativeTDB = function(y, m, d, tz) {
    y = y - 2000;
    // 1月,2月は、前年13月,14月にする
    if( m <= 1 ) {
      y = y - 1;
      m = m + 12;
    }
    return 365*y + 30*m + d - 3.5 - tz/24.0
      + Math.floor(3.0*(m+2)/5) + Math.floor(y/4);
  };

  // Leap seconds list.
  // Each element is array formed with
  // leaping day (mjd-36204) and leap seconds
  var arr_leap_boundary = [
    [730,0],
    [1826,1],
    [2557,2],
    [2922,3],
    [3287,4],
    [3652,5],
    [4018,6],
    [4383,7],
    [4748,8],
    [5113,9],
    [5295,10],
    [5479,11],
    [5844,12],
    [6209,13],
    [6574,14],
    [6940,15],
    [7305,16],
    [7670,17],
    [8035,18],
    [8582,19],
    [8947,20],
    [9312,21],
    [10043,22],
    [10957,23],
    [11688,24],
    [12053,25],
    [12600,26],
    [12965,27],
    [13330,28],
    [13879,29],
    [14426,30],
    [14975,31],
    [17532,32],
    [18628,33],
    [19723,34], // 1/Jan/2012
    [20819,35], // 1/Jan/2015
    [-1, 36] // TAIL
  ];

  /**
   * Calculates dT = TDT-UTC = (TAI+32.184[s])-UTC [day]
   * @param y UTC year
   * @param m UTC month, starting with 0.
   * @param d UTC day of month, starting with 1.
   * @return dT value [day]
   */
  M.calculateRotationDelay = function(y, m, d) {
    var mjd = calcMJD(y, m, d);
    var d = mjd - 36204;
    var len = arr_leap_boundary.length;
    var leapseconds = arr_leap_boundary[len-1][1];
    for( var n = 0; n < len - 1; n++ ) {
      var leapbound = arr_leap_boundary[n];
      if( d < leapbound[0] ) {
        leapseconds = leapbound[1];
        break;
      }
    }
    return (leapseconds+32.184)/86400.0;
  }

  /**
   * (INTERNAL) Calculates the distance between sun and earth.
   * @param ry = Relative years from J2000.1.
   * @return Distance [AU]
   */
  function calcDistance(ry) {
    var q = (0.007256-0.0000002*ry)*Math.sin((267.54+359.991*ry)*rpd)
      +0.000091*Math.sin((265.1+ 719.98*ry)*rpd)
      +0.000030*Math.sin(( 90.0)*rpd)
      +0.000013*Math.sin(( 27.8+4452.67*ry)*rpd)
      +0.000007*Math.sin((254.0+ 450.4*ry)*rpd)
      +0.000007*Math.sin((156.0+ 329.6*ry)*rpd);
  return Math.pow(10,q);
}

  /**
   * (INTERNAL) Calculates ecliptic longitude
   * @param ry Relative years from J2000.1.1.
   * @return Ecliptic longitude [deg].
   */
  function calcEclLon(ry) {
    var ret = 280.4603+360.00769*ry
      +(1.9146-0.00005*ry)*Math.sin((357.538+359.991*ry)*rpd)
      +0.0200*Math.sin((355.05+ 719.981*ry)*rpd)
      +0.0048*Math.sin((234.95+  19.341*ry)*rpd)
      +0.0020*Math.sin((247.1 + 329.64 *ry)*rpd)
      +0.0018*Math.sin((297.8 +4452.67 *ry)*rpd)
      +0.0018*Math.sin((251.3 +   0.20 *ry)*rpd)
      +0.0015*Math.sin((343.2 + 450.37 *ry)*rpd)
      +0.0013*Math.sin(( 81.4 + 225.18 *ry)*rpd)
      +0.0008*Math.sin((132.5 + 659.29 *ry)*rpd)
      +0.0007*Math.sin((153.3 +  90.38 *ry)*rpd)
      +0.0007*Math.sin((206.8 +  30.35 *ry)*rpd)
      +0.0006*Math.sin(( 29.8 + 337.18 *ry)*rpd)
      +0.0005*Math.sin((207.4 +   1.50 *ry)*rpd)
      +0.0005*Math.sin((291.2 +  22.81 *ry)*rpd)
      +0.0004*Math.sin((234.9 + 315.56 *ry)*rpd)
      +0.0004*Math.sin((157.3 + 299.30 *ry)*rpd)
      +0.0004*Math.sin(( 21.1 + 720.02 *ry)*rpd)
      +0.0003*Math.sin((352.5 +1079.97 *ry)*rpd)
      +0.0003*Math.sin((329.7 +  44.43 *ry)*rpd);
    return ret - Math.floor(ret/360.0)*360.0;
  }

  /**
   * Calculates position.
   * @param k Relative days based on J2000.0 TDB. (calculateRelativeTDB)
   * @param sd hours, minutes and seconds [day].
   * @param dr Rotation delay [day]. (calculateRotationDelay)
   * @param lat Latitude [deg].
   * @param lon Longitude [deg].
   * @param tz Timezone [hour].
   * @return The hash contains following properties:
   *  tan_a: tan(azimuth)
   *  sin_h: sin(altitude)
   *  decl: declination [deg]
   *  ha: hour angle [deg]
   *  elon: ecliptic longitude [deg]
   *  dist: Distance between sun and earth [astronomical unit]
   *  da: offset of azimuth [deg]
  */
  M.calculateTrigonometricPosition = function(k, sd, dr, lat, lon, tz) {
    var k0 = k + sd + dr;
    // Relative Julian year based on J2000.1.1.
    var ry = k0 / 365.25;
    // ecliptic longitude [deg]
    var ecllon = calcEclLon(ry);
    var ecllam = ecllon * rpd;
    var dist = calcDistance(ry);
    var edeg = 23.439291-0.000130042*ry; // 黄道傾角
    var erad = edeg * rpd;
    var phi = lat * rpd;
    // right ascension
    var asce =
      Math.atan(
        Math.tan(ecllam) * Math.cos(erad)
      ) * dpr;
    // declination
    var declrad = 
      Math.asin(
        Math.sin(ecllam) * Math.sin(erad)
      );
    // asce [-90,90] -> [0,180]
    if( asce < 0 ) {
      asce = asce + 180.0;
    }
    // asce [0,180] -> [0,180] (ecllon [0,180]) or [90,180] (ecllon [180,])
    if( ecllon > 180 ) {
      asce = asce + 180.0;
    }
    // p - 恒星時(TはGMT)
    var p = 100.4606+360.007700536*ry+0.00000003879*ry*ry - 15.0*tz + 360.0 * sd + lon;
    // pを0-360におさめる
    p = p - Math.floor(p/360) * 360;
    // ha- 太陽時角
    var ha = p - asce;
    var harad = ha * rpd;
    // s -> decl
    var sin_ha = Math.sin(harad);
    var cos_decl = Math.cos(declrad);
    var Aa = -cos_decl * sin_ha;
    var Ab = Math.sin(declrad) * Math.cos(phi) -
      cos_decl*Math.sin(phi)*Math.cos(harad);
    var sin_h = Math.sin(declrad)*Math.sin(phi) +
      Math.cos(declrad)*Math.cos(phi)*Math.cos(harad);
    var da, tan_a;
    // Specifies quadrant.
    if( Ab == 0 ) {
      // Aa/Ab = INF
      tan_a = 0;
      if( sin_ha > 0 ) {
        da = -90;
      }
      else if( sin_ha < 0 ) {
        da = 90;
      }
      else {
        da = 0;
        sin_h = 1;
      }
    }
    else {
      tan_a = Aa/Ab;
      if( Ab >= 0 ) {
        da = 0;
      }
      else {
        da = 180
      }
    }
    return {
      "tan_a": tan_a,
      "sin_h": sin_h,
      "decl": declrad*dpr,
      "ha": ha,
      "elon": ecllon,
      "dist": dist,
      "da": da
    };
  };

  /**
   * (INTERNAL) Calculates position at specified datetime and position.
   * @param y Full year.
   * @param m Month, starting with 0.
   * @param d Day of month, starting with 1.
   * @param tz Time zone [hours]
   * @param sd Subday time.
   * @param lon Longitude of position.
   * @param lat Latitude of position.
   * @param pos Object including "lat" and "lon" properries.
   * @return The hash contains following properties:
   *  azimuth: azimuth [deg]
   *  height: height [deg] (without atmospheric correction)
   *  decl: declination [deg] (赤緯)
   *  ha: hour angle [deg] (時角)
   *  ecllon: ecliptic longitude [deg] (太陽黄経)
   *  dist: Distance between sun and earth [astronomical unit]
   */
  function calcPosition(y, m, d, tz, sd, lon, lat) {
    var dr = M.calculateRotationDelay(y, m, d);
    var k = M.calculateRelativeTDB(y, m, d, tz);
    var tpos = M.calculateTrigonometricPosition(k, sd, dr, lat, lon, tz);
    var azimuth = Math.atan(tpos["tan_a"]) * dpr + tpos["da"];
    azimuth = azimuth - Math.floor(azimuth/360.0)*360.0;
    return {
      "azimuth": azimuth,
      "height": Math.asin(tpos["sin_h"])*dpr,
      "decl": tpos["decl"],
      "ha": tpos["ha"],
      "ecllon": tpos["ecllon"],
      "dist": tpos["dist"]
    };
  };

  /**
   * Calculates position at specified datetime and position.
   * @param date Native Date.
   * @param pos Object including "lat" and "lon" properries.
   * @return The hash contains following properties:
   *  azimuth: azimuth [deg]
   *  height: height [deg] (without atmospheric correction)
   *  decl: declination [deg] (赤緯)
   *  ha: hour angle [deg] (時角)
   *  ecllon: ecliptic longitude [deg] (太陽黄経)
   *  dist: Distance between sun and earth [astronomical unit]
   */
  M.calculatePosition = function(date, pos) {
    return calcPosition(
      date.year,
      date.month,
      date.mday,
      date.tz,
      (
        date.hours*3600.0
        +date.minutes*60.0
        +date.seconds
        +date.milliseconds
      ) / 86400.0,
      pos.lon,
      pos.lat
    );
  };

  /**
   * Calculates series of events.
   * @param date Native Date.
   * @param pos Object including "lat" and "lon" properries.
   * @param elv Elevation [m].
   * @param dtsec Seconds of each iteration.
   * @return The array of events. Array is sorted by the time.
   *    Each event has following properties.
   * type: Text of event.
   * typecode: Number indicating event type.
   * boundary: "Start", "End", or "Occurred".
   * boundarycode: Number indication boundary type. 1-start, -1-end, 0-occurred
   * azimuth: azimuth [deg].
   * altitude: Altitude of the sun [deg].
   * time: When the event happened.
   */
  M.calculateStatusSeries = function(date, pos, elv, dtsec) {
    var y = date.year;
    var m = date.month;
    var d = date.mday;
    var tz = date.tz;
    var lon = pos.lon;
    var lat = pos.lat;
    // Apparent Depression (見かけの俯角)
    var adep = 2.12/60.0*Math.sqrt(elv);
    //
    var dt = dtsec / 86400.0; // dt[sec] -> dt[day]
    // dr, k
    var dr = M.calculateRotationDelay(y, m, d);
    var k = M.calculateRelativeTDB(y, m, d, tz);
    // (y-m-dT0:0:0) - 2*dt
    var t_mm = -dt-dt;
    var res_mm = M.calculateTrigonometricPosition(k, t_mm, dr, lat, lon, tz);
    // (y-m-dT0:0:0) - dt
    var t_m = -dt;
    var res_m = M.calculateTrigonometricPosition(k, t_m, dr, lat, lon, tz);
    // (y-m-dT0:0:0) to (y-m-dT23:59:59.999)
    var ret = {"first": null, "event": []};
    var st_m = -1;
    var arr_dsinh_m = null;
    for(var t = 0.0; t < 86400.0; t = t + dtsec) {
      // Position
      var res = M.calculateTrigonometricPosition(
        k, Math.floor(t)/86400.0, dr, lat, lon, tz
      );
      // Parallax (視差)
      var plx = 8.794148/3600.0 / res.dist;
      // d(sin_h)s
      var arr_dsinh = [
        // night | actronomical twilight
        res.sin_h-Math.sin((-18.0-adep+plx)*rpd),
        // actronomical twilight | naval twilight
        res.sin_h-Math.sin((-12.0-adep+plx)*rpd),
        // naval twilight | civil twilight
        res.sin_h-Math.sin(( -6.0-adep+plx)*rpd),
        // civil twilight | daytime
        res.sin_h-Math.sin(
          (-M.Semidiameter-adep-M.AtmosphericRefraction+plx)*rpd
        )
      ];
      // Current status
      var st = arr_dsinh.length;
      for( var n = 0; n < arr_dsinh.length; n++ ) {
        if( arr_dsinh[n] < 0 ) {
          st = n;
          break;
        }
      }
      //
      if( st_m < 0 ) {
        // first iteration
        ret.first = {
          "type": arr_status_text[st],
          "typecode": st
        };
      }
      else if( st > st_m ) {
        // status goes up
        var dsinh = arr_dsinh[st];
        var dsinh_m = arr_dsinh_m[st];
        var target;
        if( dsinh*dsinh > dsinh_m*dsinh_m ) {
          target = res_m;
          tt = t_m;
        }
        else {
          target = res;
          tt = t;
        }
        var azimuth = Math.atan(target["tan_a"]) * dpr + target["da"];
        azimuth = azimuth - Math.floor(azimuth/360.0)*360.0;
        ret["event"].push({
          "type": arr_status_text[st],
          "typecode": st,
          "boundary": "start",
          "boundarycode": 1,
          "azimuth": azimuth,
          "altitude": Math.asin(target["sin_h"]) * dpr,
          "time": M.Date.fromYMDS(y, m, d, tt, tz)
        });
      }
      else if( st < st_m ) {
        // status goes down
        var dsinh = arr_dsinh[st];
        var dsinh_m = arr_dsinh_m[st];
        var target, tt;
        if( dsinh*dsinh > dsinh_m*dsinh_m ) {
          target = res_m;
          tt = t_m;
        }
        else {
          target = res;
          tt = t;
        }
        var azimuth = Math.atan(target["tan_a"]) * dpr + target["da"];
        azimuth = azimuth - Math.floor(azimuth/360.0)*360.0;
        ret["event"].push({
          "type": arr_status_text[st_m],
          "typecode": st_m,
          "boundary": "end",
          "boundarycode": -1,
          "azimuth": azimuth,
          "altitude": Math.asin(target["sin_h"]) * dpr,
          "time": M.Date.fromYMDS(y, m, d, tt, tz)
        });
      }
      else if( st >= M.TC_DAYTIME &&
          res_m["sin_h"]-res_mm["sin_h"] > 0 &&
          res["sin_h"]-res_m["sin_h"] < 0 ) {
        // clumination
        // time of maximum point is within (t-dt-dt,t)
        // Assuming, points
        // (-1,sin_h(t-dt-dt)), (0,sin_h(t-dt)), (1,sin_h(t)) are
        // on the same parabola.
        // vertex.x = (-y1+y3)/(2.0*(y1-2.0*y2+y3))
        // where y1=sin_h(t-dt-dt), y2=sin_h(t-dt), y3=sin_h(t)
        // vertex.x is within (-1.0, 1.0) -> time:(t-dt-dt, t)
        var vx = (-res_mm["sin_h"]+res["sin_h"])/
            (2.0*res_mm["sin_h"]-2.0*res_m["sin_h"]+res["sin_h"]);
        var target, tt;
        if( vx < -0.5 ) {
          target = res_mm;
          tt = t_mm;
        }
        else if( vx < 0.5 ) {
          target = res_m;
          tt = t_m;
        }
        else {
          target = res;
          tt = t;
        }
        var azimuth = Math.atan(target["tan_a"]) * dpr + target["da"];
        azimuth = azimuth - Math.floor(azimuth/360.0)*360.0;
        ret["event"].push({
            "type": arr_status_text[6],
            "typecode": M.TC_CULMINATION,
            "boundary": "occurred",
            "boundarycode": 0,
            "azimuth": azimuth,
            "altitude": Math.asin(target["sin_h"]) * dpr,
            "time": M.Date.fromYMDS(y, m, d, tt, tz)
        });
      }
      // updates
      res_mm = res_m;
      res_m = res;
      st_m = st;
      t_mm = t_m;
      t_m = t;
      arr_dsinh_m = arr_dsinh;
    }
    return ret;
  };


})((this || 0).self || global);

