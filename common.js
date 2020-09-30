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
    _markerIconFocus,
    _refreshIcon,
    _refreshButton,
    _selectedVin = null,
    _selectedIndex = -1;

function initMap() {
    $.getJSON('config.json', function(result) {
        if(result.environment === 'development') _apiUrl = 'http://gps.bataviarent.com/prime/iot/v1/api/Traccar/Get_Token_InfoAsync';
        else if(result.environment === 'production') _apiUrl = 'http://localhost:5000/Traccar/Get_Token_InfoAsync';

        _refreshIcon = document.createElement('i');
        _refreshIcon.className = 'fas fa-sync fa-2x';

        _refreshButton = document.createElement('button');
        _refreshButton.className = 'refresh-btn';
        _refreshButton.style.marginRight = '20px';
        _refreshButton.style.marginTop = '20px';
        _refreshButton.appendChild(_refreshIcon);
        _refreshButton.addEventListener('click', function() {
            setMarkers();
        });

        _map = new google.maps.Map(document.getElementById('map'), {
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false
        });

        _map.controls[google.maps.ControlPosition.TOP_RIGHT].push(
            _refreshButton
        );

        setMarkers();
    });
}

// setInterval(setMarkers, 30000);

function setMarkers() {
    _refreshIcon.classList.add('fa-spin');
    
    _markerIcon = {
        url: 'images/car-marker-32.png',
        size: new google.maps.Size(40, 40),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(20, 40)
    };

    _markerIconFocus = {
        url: 'images/car-marker-64.png',
        size: new google.maps.Size(48, 48),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(24, 48)
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
                    setMapOnAll(null);

                    $.each(payload.vins, function(i, e) {
                        let html = '<a href="javascript:void(0);" class="list-group-item list-group-item-action btn-select-device ' + (e.vin === _selectedVin ? 'active' : '') + '" data-vin="' + e.vin + '" data-index="' + i + '" style="cursor-p">';
                        html += e.name;
                        html += '</a>';

                        _deviceList.append(html);

                        const data = e;
                        const latLng = new google.maps.LatLng(data.coords.lat, data.coords.lon);
                        const marker = new google.maps.Marker({
                            position: latLng,
                            title: data.name,
                            map: _map,
                            icon: _markerIcon
                        });

                        infoText = '<div class="row no-gutters">';
                        infoText += '<div class="col-6">';
                        infoText += '<table class="table table-borderless table-sm mb-0">';
                        infoText += '<tr>';
                        infoText += '<td>Plate No</td>';
                        infoText += '<td style="width: 1%;">:</td>';
                        infoText += '<td>' + data.name + '</td>';
                        infoText += '</tr>';
                        infoText += '<tr>';
                        infoText += '<td>VIN</td>';
                        infoText += '<td style="width: 1%;">:</td>';
                        infoText += '<td>' + data.vin + '</td>';
                        infoText += '</tr>';
                        infoText += '<tr>';
                        infoText += '<td>Alarm</td>';
                        infoText += '<td style="width: 1%;">:</td>';
                        infoText += '<td style="color: red;">' + data.alarm + '</td>';
                        infoText += '</tr>';
                        infoText += '<tr>';
                        infoText += '<td>Speed (KM/H)</td>';
                        infoText += '<td style="width: 1%;">:</td>';
                        infoText += '<td>' + data.coords.speed + '</td>';
                        infoText += '</tr>';
                        infoText += '<tr>';
                        infoText += '<td>Odometer (KM)</td>';
                        infoText += '<td style="width: 1%;">:</td>';
                        infoText += '<td>' + data.odometer + '</td>';
                        infoText += '</tr>';
                        infoText += '<tr>';
                        infoText += '<td>Total Distance (KM)</td>';
                        infoText += '<td style="width: 1%;">:</td>';
                        infoText += '<td>' + data.total_distance + '</td>';
                        infoText += '</tr>';
                        infoText += '</table>';
                        infoText += '</div>';
                        infoText += '<div class="col-6">';
                        infoText += '<table class="table table-borderless table-sm mb-0">';
                        infoText += '<tr>';
                        infoText += '<td style="vertical-align: top;">Address</td>';
                        infoText += '<td style="width: 1%; vertical-align: top;">:</td>';
                        infoText += '<td>' + data.coords.address + '</td>';
                        infoText += '</tr>';
                        infoText += '<tr>';
                        infoText += '<td>Latitude</td>';
                        infoText += '<td style="width: 1%;">:</td>';
                        infoText += '<td>' + data.coords.lat + '</td>';
                        infoText += '</tr>';
                        infoText += '<tr>';
                        infoText += '<td>Longitude</td>';
                        infoText += '<td style="width: 1%;">:</td>';
                        infoText += '<td>' + data.coords.lon + '</td>';
                        infoText += '</tr>';
                        infoText += '</table>';
                        infoText += '</div>';
                        infoText += '</div>';

                        marker.infowindow = new google.maps.InfoWindow({
                            content: infoText
                        });

                        // marker.addListener('click', function() {
                        //     infoWindow.open(map, marker);
                        // });

                        _markers.push(marker);
                        _latLngBounds.extend(marker.position);
                    });

                    $('.btn-select-device').on('click', function() {
                        $.each(_markers, function(i, e) {
                            _markers[i].setIcon(_markerIcon);
                            _markers[i].infowindow.close();
                        });

                        _deviceList.children('a').removeClass('active');
                        $(this).addClass('active');

                        const sel = $(this).data('vin');
                        const index = $(this).data('index');
                        _selectedVin = sel;
                        _selectedIndex = index;
                        const find = _.find(_vins, {vin: sel});
                        const selLatLng = new google.maps.LatLng(find.coords.lat, find.coords.lon);
                        _map.setCenter(selLatLng);
                        _markers[index].setIcon(_markerIconFocus);
                        _markers[index].infowindow.open(_map, _markers[index]);
                    });

                    if(_selectedVin === null) {
                        _map.setCenter(_latLngBounds.getCenter());
                        _map.fitBounds(_latLngBounds);
                    } else {
                        const find = _.find(_vins, {vin: _selectedVin});
                        const selLatLng = new google.maps.LatLng(find.coords.lat, find.coords.lon);
                        _map.setCenter(selLatLng);
                        _markers[_selectedIndex].setIcon(_markerIconFocus);
                        _markers[_selectedIndex].infowindow.open(_map, _markers[_selectedIndex]);
                    }
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
        } else alert(result.msg);
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