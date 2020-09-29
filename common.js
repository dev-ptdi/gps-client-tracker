const googleMapsApiKey = 'AIzaSyDtUB_Kzv_2b7NSod6LkEv-iVZ_KhBGsIw';

var _apiUrl = '',
    _apiKey = 'XRFhwNDIyQDMxMzcyZTMyMmUzMlTclR21RaFh',
    _apiSecret = 'TclR2Y1dE4vdkNPT09GJwRzvKzhialRCTclRA',
    _map,
    _deviceList = $('#device-list'),
    _vins = [],
    _markerPos = [],
    _markers = [],
    _latLngBounds,
    _markerIcon,
    _refreshIcon,
    _refreshButton;

function initMap() {
    $.getJSON('config.json', function(result) {
        if(result.environment == 'development') _apiUrl = 'http://gps.bataviarent.com/prime/iot/v1/api/Traccar/Get_Token_InfoAsync';
        else if(result.environment == 'production') _apiUrl = 'http://localhost:5000/Traccar/Get_Token_InfoAsync';

        _refreshIcon = document.createElement('i');
        _refreshIcon.className = 'fas fa-sync';

        _refreshButton = document.createElement('button');
        _refreshButton.className = 'btn btn-success rounded';
        _refreshButton.style.marginRight = '20px';
        _refreshButton.style.marginTop = '20px';
        _refreshButton.appendChild(_refreshIcon);
        _refreshButton.addEventListener('click', function() {
            _refreshIcon.classList.add('fa-spin');
            setMarkers();
        });

        _map = new google.maps.Map(document.getElementById('map'), {
            center: {
                lat: -34.397,
                lng: 150.644,
              },
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            zoom: 10
        });

        _map.controls[google.maps.ControlPosition.TOP_RIGHT].push(
            _refreshButton
        );

        // setMarkers();
    });
}

setInterval(setMarkers, 30000);

function setMarkers() {
    _markerIcon = {
        url: 'images/car-marker-32.png',
        size: new google.maps.Size(40, 40),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(20, 40)
    };

    const url = _apiUrl;
    const apiKey = _apiKey;
    const apiSecret = _apiSecret;
    const params = {
        lang: 'en',
        token: getUrlVars()['token']
    };

    const headers = {
        'api_key': apiKey,
        'api_secret': apiSecret
    };

    ajaxCallPost(url, headers, params, function(result) {
        if(result.result) {
            const payload = result.payload;
            _markerPos = [];

            if(!payload.is_expired) {
                _deviceList.empty();
                _vins = payload.vins;

                if(payload.vins.length > 0) {
                    _latLngBounds = new google.maps.LatLngBounds();

                    $.each(payload.vins, function(i, e) {
                        let html = '<a href="javascript:void(0);" class="list-group-item list-group-item-action btn-vin" data-vin="' + e.vin + '" style="cursor-p">';
                        html += e.vin;
                        html += '</a>';

                        _deviceList.append(html);

                        const markerObj = {
                            title: e.name,
                            lat: e.coords.lat,
                            lng: e.coords.lon,
                            description: 'VIN: ' + e.vin
                        };

                        _markerPos.push(markerObj);
                    });

                    // $('.btn-vin').on('click', function() {
                    //     _deviceList.children('a').removeClass('active');
                    //     $(this).addClass('active');
                    //     const vin = $(this).data('vin');
                    //     const find = _.find(_vins, {vin: vin});
                    //     getDeviceLocation(find);
                    // });

                    setMapOnAll(null);

                    for(let i = 0; i < _markerPos.length; i++) {
                        const data = _markerPos[i];
                        const latLng = new google.maps.LatLng(data.lat, data.lng);
                        const marker = new google.maps.Marker({
                            position: latLng,
                            title: data.title,
                            map: _map,
                            icon: _markerIcon
                        });

                        marker._infowindow = new google.maps.InfoWindow({
                            content: '<div style="font-weight: bold; font-size: 1rem; margin-bottom: 0.7rem;">' + data.title + '</div><p style="margin: 0;">' + data.description + '</p>'
                        });

                        google.maps.event.addListener(marker, 'click', function() {
                            this._infowindow.open(_map, this);
                        });

                        google.maps.event.trigger(marker, 'click');

                        _markers.push(marker);
                        _latLngBounds.extend(marker.position);
                    }

                    _map.setCenter(_latLngBounds.getCenter());
                    _map.fitBounds(_latLngBounds);
                } else {
                    if(navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(function(pos) {
                            const coords = pos.coords;
                
                            _map = new google.maps.Map(document.getElementById('map'), {
                                center: {
                                    lat: coords.latitude,
                                    lng: coords.longitude
                                },
                                mapTypeControl: false,
                                streetViewControl: false,
                                fullscreenControl: false,
                                zoom: 18
                            });
                
                            getDevices();
                        }, function(err) {
                            alert('Google Maps Error: ' + err);
                        });
                    } else alert('Please allow location request');
                }

                _refreshIcon.classList.remove('fa-spin');
            } else alert('Expired');
        } else alert(result.message);
    });
}

function getDeviceLocation(data) {
    const coords = data.coords;
    setMapOnAll(null);
    const latLng = new google.maps.LatLng(coords.lat, coords.lon);
    _latLngBounds = new google.maps.LatLngBounds();

    const marker = new google.maps.Marker({
        position: latLng,
        title: data.name,
        map: _map,
        icon: _markerIcon
    });

    _latLngBounds.extend(marker.position);
    _markers.push(marker);

    _map.setCenter(_latLngBounds.getCenter());
    // _map.setZoom(18);
    _map.fitBounds(_latLngBounds);
}

function setMapOnAll(map) {
    for(let i = 0; i < _markers.length; i++) {
        _markers[i].setMap(map);
    }
}

function getUrlVars() {
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
}

function ajaxCallPost(url, headers, data, callback) {
    $.ajax({
        url: url,
        data: JSON.stringify(data),
        type: 'post',
        dataType: 'json',
        headers: headers,
        contentType: 'application/json; charset=utf-8',
        success: function(result) {
            callback(result);
        }
    });
}