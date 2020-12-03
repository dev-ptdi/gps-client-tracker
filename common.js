var _mapBoxPublicToken = 'pk.eyJ1IjoiZGV2LXB0ZGkiLCJhIjoiY2tmZHBnZWM5MDlqejJ6bmVxbWJndWowNCJ9.HdpiDmcwWSzPba_OrX3Rxw',
    _map = null,
    _realtime = null,
    _deviceList = $('#device-list'),
    _vins = [],
    _markerPos = [],
    _markers = [],
    _markerGroup = null,
    _latLngBounds = [],
    _selectedVin = null,
    _selectedIndex = -1,
    _carIcon = null,
    _carIconSelected = null;

$(function() {
    _carIcon = L.icon({
        iconUrl: 'images/car-marker-32.png',
        iconSize: [48, 48],
        iconAnchor: [24, 48],
        popupAnchor: [0, -50],
    });

    _carIconSelected = L.icon({
        iconUrl: 'images/car-marker-64.png',
        iconSize: [64, 64],
        iconAnchor: [32, 64]
    });

    _map = L.map('map').setView([0, 0], 13);

    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox/streets-v11',
        tileSize: 512,
        zoomOffset: -1,
        accessToken: _mapBoxPublicToken,
    }).addTo(_map);

    // L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    //     attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    // }).addTo(_map);

    _markerGroup = L.layerGroup().addTo(_map);

    getLocations();
});

function getLocations() {
    const params = {
        token: getUrlVars()['token']
    };

    ajaxCallPost('data.php', params, function(result) {
        if(result.result) {
            const payload = result.payload;
            _markerPos = [];
            _markers = [];
            _deviceList.empty();
            _latLngBounds = L.latLngBounds();
            _map.removeLayer(_markerGroup);
            _markerGroup = L.layerGroup().addTo(_map);

            if(!payload.is_expired) {
                _vins = payload.vins;

                if(_vins.length > 0) {
                    $.each(_vins, function(i, e) {
                        const coords = e.coords;

                        let html = '<div class="card mb-3">';
                        html += '<div class="card-header" id="heading-' + e.vin + '">';
                        html += '<h5 class="mb-0">';
                        html += '<button class="btn btn-link btn-select-vin" data-toggle="collapse" data-name="' + e.name + '" data-vin="' + e.vin + '" data-index="' + i + '" data-target="#collapse-' + e.vin + '" aria-expanded="true" aria-controls="collapse-' + e.vin + '">' + e.name + '</button>'
                        html += '</h5>';
                        html += '</div>';
                        html += '<div id="collapse-' + e.vin + '" class="collapse ' + (i == _selectedIndex ? 'show' : '') + '" aria-labelledby="heading-' + e.vin + '" data-parent="#device-list">';
                        html += '<div class="card-body">';
                        html += '<table class="table table-bordered table-hover table-sm mb-0 small">';
                        html += '<tr><td>Server Time</td><td class="text-right">' + (coords == null ? 'NA' : coords.server_time) + '</td></tr>';
                        html += '<tr><td style="width: 25%;">Plate Number</td><td class="text-right font-weight-bold">' + e.name + '</td></tr>';
                        html += '<tr><td>VIN</td><td class="text-right">' + e.vin + '</td></tr>';
                        html += '<tr><td>Status</td><td class="text-right ' + (e.status === 'offline' ? 'text-danger' : (e.status === 'online' ? 'text-success' : 'text-warning')) + '">' + e.status + '</td></tr>';
                        html += '<tr><td>Ignition</td><td class="text-right">' + (e.ignition ? 'On' : 'Off') + '</td></tr>';
                        html += '<tr><td>Signal Strength</td><td class="text-right">' + (e.rssi / 5) * 100 + '%</td></tr>';
                        html += '<tr><td>Battery Level</td><td class="text-right">' + e.battery + '%</td></tr>';
                        html += '<tr><td>Speed</td><td class="text-right">' + (coords == null ? 'NA' : $.number(coords.speed, 2)) + ' KM/H</td></tr>';
                        // html += '<tr><td>Odometer</td><td class="text-right">' + (coords == null ? 'NA' : $.number(e.odometer / 1000, 2)) + ' KM</td></tr>';
                        html += '<tr><td>Odometer</td><td class="text-right">' + (coords == null ? 'NA' : $.number(e.total_distance / 1000)) + ' KM</td></tr>';
                        html += '<tr><td>Latitude</td><td class="text-right">' + (coords == null ? 'NA' : coords.lat) + '</td></tr>';
                        html += '<tr><td>Longitude</td><td class="text-right">' + (coords == null ? 'NA' : coords.lon) + '</td></tr>';
                        html += '<tr><td>Accuracy</td><td class="text-right">' + (coords == null ? 'NA' : coords.accuracy) + '</td></tr>';
                        html += '<tr><td>Address</td><td class="text-right">' + (coords == null ? 'NA' : coords.address) + '</td></tr>';
                        html += '<tr><td>Alarm</td><td class="text-right text-danger font-weight-bold">' + e.alarm + '</td></tr>';
                        html += '<tr><td>Geofence</td><td class="text-right">' + (coords == null ? 'NA' : (coords.geofence.length > 0 ? 'Yes' : 'No')) + '</td></tr>';
                        html += '</table>';
                        html += '</div>';
                        html += '</div>';
                        html += '</div>';

                        _deviceList.append(html);

                        const marker = L.marker([coords.lat, coords.lon], {icon: _carIcon}).addTo(_markerGroup).bindTooltip('<strong>' + e.name + '</strong>', {offset: [0, -50], direction: 'top', permanent: true}).openTooltip();
                        _markers.push(marker);
                        _latLngBounds.extend([coords.lat, coords.lon]);
                    });

                    $('.btn-select-vin').on('click', function() {
                        selectVin($(this).data('index'));
                    });

                    if(_selectedIndex == -1) {
                        _map.fitBounds(_latLngBounds);
                    } else {
                        selectVin(_selectedIndex);
                    }

                    setInterval(updatePosition, _loadInverval);
                }
            } else alert('Token expired');
        } else alert(result.msg);
    });
}

function selectVin(index) {
    for(let i = 0; i < _markers.length; i++) {
        const prevTooltip = _markers[i].getTooltip();
        prevTooltip.options.offset = [0, -50];
        _markers[i].unbindTooltip();
        _markers[i].setIcon(_carIcon).bindTooltip(prevTooltip);
    }

    _selectedIndex = index;
    const marker = _markers[index];
    const tooltip = marker.getTooltip();
    tooltip.options.offset = [0, -68];
    marker.unbindTooltip();
    marker.setIcon(_carIconSelected).bindTooltip(tooltip);
    _map.setView(marker.getLatLng());
}

function updatePosition() {
    const params = {
        token: getUrlVars()['token']
    };

    ajaxCallPost('data.php', params, function(result) {
        if(result.result) {
            const payload = result.payload;
            // _latLngBounds = L.latLngBounds();

            if(!payload.is_expired) {
                const vins = payload.vins;
                // _latLngBounds = L.latLngBounds();

                if(vins.length > 0) {
                    $.each(vins, function(i, e) {
                        const coords = e.coords;
                        if(coords != null) {
                            const index = _.findIndex(_vins, {vin: e.vin});
                            _markers[index].setLatLng([coords.lat, coords.lon]);
                            // _latLngBounds.extend([coords.lat, coords.lon]);
                        }
                    });

                    if(_selectedIndex == -1) {
                        // _map.fitBounds(_latLngBounds);
                    } else {
                        selectVin(_selectedIndex);
                    }
                }
            } else alert('Token expired');
        } else alert(result.message);
    });
}

function getUrlVars() {
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++) {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
}

function ajaxCallPost(url, data, callback) {
    $.ajax({
        url: url,
        data: data,
        type: 'post',
        dataType: 'json',
        success: function(result) {
            callback(result);
        }
    });
}