(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
require('./map')
},{"./map":2}],2:[function(require,module,exports){
const polyline = require("google-polyline");

let waypoints = [];
let map;
let service;


function initMap() {
  var directionsService = new window.google.maps.DirectionsService();
  var directionsRenderer = new window.google.maps.DirectionsRenderer();

  var mapOptions = {
    zoom: 7,
    center: { lat: 19.07596, lng: 72.87764 },
  };

  map = new google.maps.Map(document.getElementById("map"), mapOptions);

  var request = {
    origin: "mumbai",
    destination: "pune",
    travelMode: "DRIVING",
  };

  directionsService.route(request, function (result, status) {
    if (status == "OK") {
      directionsRenderer.setDirections(result);
      waypoints = polyline.decode(result.routes[0].overview_polyline);
    }
    const PolygonCoords = PolygonPoints();
    const PolygonBound = new google.maps.Polygon({
    paths: PolygonCoords,
    strokeColor: "#FF0000",
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: "#FF0000",
    fillOpacity: 0.35,
    });

    PolygonBound.setMap(map);

    service = new google.maps.places.PlacesService(map);
    for(let j = 0;j< waypoints.length;j+=40){
      service.nearbySearch({
        location: { lat:waypoints[j][0], lng:waypoints[j][1] },
        radius: '20000',
        type: ['restaurant']
      }, callback);

      function callback(results, status) {
        if (status == google.maps.places.PlacesServiceStatus.OK) {
          for (var i = 0; i < results.length; i++) {
            if(google.maps.geometry.poly.containsLocation(results[i].geometry.location,PolygonBound) == true) {
              new google.maps.Marker({
                position: results[i].geometry.location,
                map,
                title: "Hello World!"
              });
             }
          }
        }
      }
    }
  });
   directionsRenderer.setMap(map);
 
}


function PolygonPoints() {

  let polypoints = waypoints
  let PolyLength = polypoints.length;
 

  let UpperBound = [];
  let LowerBound = [];

  for (let j = 0; j <= PolyLength - 1; j++) {
    let NewPoints = PolygonArray(polypoints[j][0]);
    UpperBound.push({ lat: NewPoints[0], lng: polypoints[j][1] });
    LowerBound.push({ lat: NewPoints[1], lng: polypoints[j][1] });
  }
   let reversebound = LowerBound.reverse();
 
  let FullPoly = UpperBound.concat(reversebound);
 
  return FullPoly;
}

function PolygonArray(latitude) {
  const R = 6378137;
  const pi = 3.14;
  //distance in meters
  const upper_offset = 300;
  const lower_offset = -300;
 
  Lat_up = upper_offset / R;
  Lat_down = lower_offset / R;
  //OffsetPosition, decimal degrees
  lat_upper = latitude + (Lat_up * 180) / pi;
  lat_lower = latitude + (Lat_down * 180) / pi;

   return [lat_upper, lat_lower];
}

var script = document.createElement("script");
script.src =
  "https://maps.googleapis.com/maps/api/js?key=&callback=initMap&libraries=places";
script.defer = true;
window.initMap = function () {
  initMap();
};
document.head.appendChild(script);

},{"google-polyline":5}],3:[function(require,module,exports){
var PRECISION = 1e5

function decode( value ) {

  var points = []
  var lat = 0
  var lon = 0

  var values = decode.integers( value, function( x, y ) {
    lat += x
    lon += y
    points.push([ lat / PRECISION, lon / PRECISION ])
  })

  return points

}

decode.sign = function( value ) {
  return value & 1 ? ~( value >>> 1 ) : ( value >>> 1 )
}

decode.integers = function( value, callback ) {

  var values = 0
  var x = 0
  var y = 0

  var byte = 0
  var current = 0
  var bits = 0

  for( var i = 0; i < value.length; i++ ) {

    byte = value.charCodeAt( i ) - 63
    current = current | (( byte & 0x1F ) << bits )
    bits = bits + 5

    if( byte < 0x20 ) {
      if( ++values & 1 ) {
        x = decode.sign( current )
      } else {
        y = decode.sign( current )
        callback( x, y )
      }
      current = 0
      bits = 0
    }

  }

  return values

}

module.exports = decode

},{}],4:[function(require,module,exports){
var PRECISION = 1e5
var CHARCODE_OFFSET = 63
var CHARMAP = {}

for( var i = 0x20; i < 0x7F; i++ ) {
  CHARMAP[ i ] = String.fromCharCode( i )
}

function encode( points ) {

  // px, py, x and y store rounded exponentiated versions of the values
  // they represent to compute the actual desired differences. This helps
  // with finer than 5 decimals floating point numbers.
  var px = 0, py = 0

  return reduce( points, function( str, lat, lon ) {

    var x = Math.round( lat * 1e5 )
    var y = Math.round( lon * 1e5 )

    str += chars( sign( ( x - px ) ) ) +
      chars( sign( ( y - py ) ) )

    px = x
    py = y

    return str

  })

}

function reduce( points, callback ) {

  var point = null

  var lat = 0
  var lon = 0
  var str = ''

  for( var i = 0; i < points.length; i++ ) {
    point = points[i]
    lat = point.lat || point.x || point[0]
    lon = point.lng || point.y || point[1]
    str = callback( str, lat, lon )
  }

  return str

}

function sign( value ) {
  return ( value < 0 ) ? ~( value << 1 ) : ( value << 1 )
}

function charCode( value ) {
  return (( value & 0x1F ) | 0x20 ) + 63
}

function chars( value ) {

  var str = ''

  while( value >= 0x20 ) {
    str += CHARMAP[ charCode( value ) ]
    value = value >> 5
  }

  str += CHARMAP[ value + 63 ]

  return str

}

module.exports = encode

},{}],5:[function(require,module,exports){
module.exports = {
  encode: require( './encode' ),
  decode: require( './decode' ),
}

},{"./decode":3,"./encode":4}]},{},[1]);
