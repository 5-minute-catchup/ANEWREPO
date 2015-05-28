(function() {
  "use strict";
  var map;
  var markers = [];
  // var socket = io.connect('https://fivemincatchup.herokuapp.com');
  var socket = io.connect('http://localhost:3000');

  var getUser = document.getElementById("map-canvas");

  function initialize() {
    var mapOptions = {
      zoom: 16
    };

    map = new google.maps.Map(document.getElementById('map-canvas'),
        mapOptions);
 
    google.maps.event.addDomListener(window, 'load', initialize);
    google.maps.event.addDomListener(window, "resize", function() {
     var center = map.getCenter();
     google.maps.event.trigger(map, "resize");
     map.setCenter(center);
    });
 
    /*Try HTML5 geolocation*/
    if(navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(position) {
        var pos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

//        new google.maps.InfoWindow({
//          map: map,
//          position: pos,
//          content: '<IMG BORDER="0" ALIGN="center" SRC=' + getUser.dataset.image + '>' + '<br><center>' + getUser.dataset.name
//        });
        map.setCenter(pos);
        /*emit the marker*/
        socket.emit('marker', {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      }, function() {
        handleNoGeolocation(true);
      });
 
    } else {
      /*Browser doesn't support Geolocation*/
      handleNoGeolocation(false);
    }
  }
 
  socket.on('show-marker', function(data) {
    
    console.log(data);
    data.forEach(function(the_marker){
      add_best_marker(the_marker)
      console.log(the_marker.user.name + " created.");
    });
  });
 
  socket.on('show-user-location', function(data) {
    console.log(data);
    var position = new google.maps.LatLng(data.lat, data.lon);
    add_new_marker(position, 'user2');
  });
 
  function add_new_marker(location, text) {
    var mapOptions = {
      zoom: 16,
      center: location
    };

    var marker = new google.maps.InfoWindow({
      position: location,
      title:"Found User!",
      content: '<IMG BORDER="0" ALIGN="Left" SRC=' + getUser.dataset.image 
      // + '<a href="/chat">Open Chat</a>'
    });
 
    /*To add the marker to the map, call setMap();*/
    //marker.setMap(map);
  }
 
  function add_best_marker(data){
    console.log("on progress");
    var pos = new google.maps.LatLng(data.lat, data.lng);  
    var marker = new google.maps.InfoWindow({
          map: map,
          position: pos,
          content: '<img class="marker-img" src=' 
          + data.user.image 
          + '/>' 
          + '<br><span class="marker-text">' 
          + data.user.name  
          + '<form action="/chat" method="get" id="setUsername'
          + '<a href="javascript:;" onclick="parentNode.submit();"></a>' 
          + '<input type="submit" value="Open Chat"></input>'
          + '</form>'
          + '</span>'
      });
    
    marker.setMap(map);
    
  }
  
  function handleNoGeolocation(errorFlag) {
    var content = 'Found user';
 
    if (errorFlag) {content = 'Error: Your browser doesn\'t support geolocation.';}
 
    var options = {
      map: map,
      position: new google.maps.LatLng(60, 105),
      content: content
    };
 
    var infowindow = new google.maps.InfoWindow(options);
    map.setCenter(options.position);
  }
  google.maps.event.addDomListener(window, 'load', initialize);
}());