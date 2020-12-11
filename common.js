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
    _carIconSelected = null,
    _reloadInterval = null,
    _btnRecenterMap = $('#btn-recenter-map');

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

function refresh() {
    for(let i = 0; i < _markers.length; i++) {
        const prevTooltip = _markers[i].getTooltip();
        prevTooltip.options.offset = [0, -50];
        _markers[i].unbindTooltip();
        _markers[i].setIcon(_carIcon).bindTooltip(prevTooltip);
    }

    $.each(_vins, function(i, e) {
        $('#collapse-' + e.DeviceId).collapse('hide');
    });

    _selectedIndex = -1;
    _map.fitBounds(_latLngBounds);
}

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
                    _btnRecenterMap.show();

                    $.each(_vins, function(i, e) {
                        const coords = e.coords;

                        let html = '<div class="card mb-3">';
                        html += '<div class="card-header" id="heading-' + e.vin + '">';
                        html += '<h5 class="mb-0">';
                        html += '<button class="btn btn-link btn-select-vin" data-toggle="collapse" data-name="' + e.name + '" data-device-id="' + e.DeviceId + '" data-index="' + i + '" data-target="#collapse-' + e.DeviceId + '" aria-expanded="true" aria-controls="collapse-' + e.DeviceId + '">' + e.name + '</button>'
                        html += '</h5>';
                        html += '</div>';
                        html += '<div id="collapse-' + e.DeviceId + '" class="collapse ' + (i == _selectedIndex ? 'show' : '') + '" aria-labelledby="heading-' + e.vin + '" data-parent="#device-list">';
                        html += '<div class="card-body">';
                        // Added share location button
                        // html += '<button type="button" class="btn btn-primary btn-sm mb-2" onclick="shareLocation(' + coords.lat + ', ' + coords.lon + ', ' + e.DeviceId + ');"><i class="fas fa-location-arrow mr-2"></i>Share Location URL</button>';
                        html += '<div class="form-group">';
                        html += '<label class="small mb-1">Share Location URL</label>';
                        html += '<div class="mb-3">';
                        html += '<div class="input-group">';
                        html += '<input type="text" class="form-control form-control-sm" id="input-share-location-' + e.DeviceId + '" value="' + generateShareLocationUrl(coords.lat, coords.lon) + '" readonly />';
                        html += '<div class="input-group-append">';
                        html += '<button type="button" class="btn btn-outline-secondary btn-sm" onclick="copyLocation(' + e.DeviceId + ');">Copy</button>';
                        html += '</div>';
                        html += '</div>';
                        html += '</div>';
                        html += '</div>';
                        // End added share location button
                        html += '<table class="table table-bordered table-hover table-sm mb-0 small">';
                        html += '<tr><td>Server Time</td><td class="text-right vin-server-time" data-device-id="' + e.DeviceId + '">' + (coords == null ? 'NA' : coords.server_time) + '</td></tr>';
                        html += '<tr><td style="width: 25%;">Plate Number</td><td class="text-right font-weight-bold vin-name" data-device-id="' + e.DeviceId + '">' + e.name + '</td></tr>';
                        html += '<tr><td style="width: 25%;">Category</td><td class="text-right vin-category" data-device-id="' + e.DeviceId + '">' + e.category + '</td></tr>';
                        html += '<tr><td>VIN</td><td class="text-right vin-vin" data-device-id="' + e.DeviceId + '">' + e.vin + '</td></tr>';
                        html += '<tr><td>Status</td><td class="text-right vin-status ' + (e.status === 'offline' ? 'text-danger' : (e.status === 'online' ? 'text-success' : 'text-warning')) + '" data-device-id="' + e.DeviceId + '">' + e.status + '</td></tr>';
                        html += '<tr><td>Ignition</td><td class="text-right vin-ignition" data-device-id="' + e.DeviceId + '">' + (e.ignition ? 'On' : 'Off') + '</td></tr>';
                        html += '<tr><td>Signal Strength</td><td class="text-right vin-rssi" data-device-id="' + e.DeviceId + '">' + (e.rssi / 5) * 100 + '%</td></tr>';
                        html += '<tr><td>Battery Level</td><td class="text-right vin-battery" data-device-id="' + e.DeviceId + '">' + e.battery + '%</td></tr>';
                        html += '<tr><td>Speed</td><td class="text-right vin-speed" data-device-id="' + e.DeviceId + '">' + (coords == null ? 'NA' : $.number(coords.speed, 2) + 'KM/H') + '</td></tr>';
                        // html += '<tr><td>Odometer</td><td class="text-right">' + (coords == null ? 'NA' : $.number(e.odometer / 1000, 2)) + ' KM</td></tr>';
                        html += '<tr><td>Odometer</td><td class="text-right vin-odometer" data-device-id="' + e.DeviceId + '">' + $.number(e.total_distance / 1000) + 'KM' + '</td></tr>';
                        html += '<tr><td>Latitude</td><td class="text-right vin-lat" data-device-id="' + e.DeviceId + '">' + (coords == null ? 'NA' : coords.lat) + '</td></tr>';
                        html += '<tr><td>Longitude</td><td class="text-right vin-lon" data-device-id="' + e.DeviceId + '">' + (coords == null ? 'NA' : coords.lon) + '</td></tr>';
                        html += '<tr><td>Accuracy</td><td class="text-right vin-accuracy" data-device-id="' + e.DeviceId + '">' + (coords == null ? 'NA' : coords.accuracy) + '</td></tr>';
                        html += '<tr><td>Address</td><td class="text-right vin-address" data-device-id="' + e.DeviceId + '">' + (coords == null ? 'NA' : coords.address) + '</td></tr>';
                        html += '<tr><td>Alarm</td><td class="text-right text-danger font-weight-bold vin-alarm" data-device-id="' + e.DeviceId + '">' + e.alarm + '</td></tr>';
                        html += '<tr><td>Geofence</td><td class="text-right vin-geofence" data-device-id="' + e.DeviceId + '">' + (coords == null ? 'NA' : (coords.geofence.length > 0 ? 'Yes' : 'No')) + '</td></tr>';
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

                    _reloadInterval = setInterval(updatePosition, _loadInverval);
                }
            } else showError('Token expired');
        } else showError(result.msg);
    });
}

function generateShareLocationUrl(lat, lon, deviceId) {
    const url = 'https://maps.google.com/?q=' + lat + ',' + lon;

    if(deviceId == undefined) return url;
    else $('#input-share-location-' + deviceId).val(url);
}

function copyLocation(deviceId) {
    const copyText = document.getElementById('input-share-location-' + deviceId);
    if(copyText.value.trim() !== '') {
        copyText.select();
        copyText.setSelectionRange(0, 99999);
        document.execCommand('copy');
        showSuccess('Location copied to clipboard');
    }
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

function recenterCar(index) {
    const marker = _markers[index];
    _map.setView(marker.getLatLng());
}

function updatePosition() {
    const params = {
        token: getUrlVars()['token']
    };

    ajaxCallPost('data.php', params, function(result) {
        if(result.result) {
            const payload = result.payload;
            _latLngBounds = L.latLngBounds();

            if(!payload.is_expired) {
                const vins = payload.vins;
                // _latLngBounds = L.latLngBounds();

                if(vins.length > 0) {
                    $.each(vins, function(i, e) {
                        const coords = e.coords;
                        if(coords != null) {
                            $('.vin-server-time[data-device-id="' + e.DeviceId + '"]').html(coords.server_time);
                            $('.vin-name[data-device-id="' + e.DeviceId + '"]').html(e.name);
                            $('.vin-category[data-device-id="' + e.DeviceId + '"]').html(e.category);
                            let statusClass = 'text-success';
                            if(e.status == 'offline') statusClass = 'text-danger';
                            $('.vin-status[data-device-id="' + e.DeviceId + '"]').removeClass('text-danger').removeClass('text-success');
                            $('.vin-status[data-device-id="' + e.DeviceId + '"]').html(e.status).addClass(statusClass);
                            $('.vin-vin[data-device-id="' + e.DeviceId + '"]').html(e.vin);
                            $('.vin-ignition[data-device-id="' + e.DeviceId + '"]').html((e.ignition ? 'On' : 'Off'));
                            $('.vin-rssi[data-device-id="' + e.DeviceId + '"]').html(((e.rssi / 5) * 100));
                            $('.vin-battery[data-device-id="' + e.DeviceId + '"]').html(e.battery + '%');
                            $('.vin-speed[data-device-id="' + e.DeviceId + '"]').html((coords == null ? 'NA' : $.number(coords.speed, 2) + 'KM/H'));
                            $('.vin-odometer[data-device-id="' + e.DeviceId + '"]').html($.number((e.total_distance / 1000)) + 'KM');
                            $('.vin-lat[data-device-id="' + e.DeviceId + '"]').html((coords == null ? 'NA' : coords.lat));
                            $('.vin-lon[data-device-id="' + e.DeviceId + '"]').html((coords == null ? 'NA' : coords.lon));
                            $('.vin-accuracy[data-device-id="' + e.DeviceId + '"]').html((coords == null ? 'NA' : coords.accuracy));
                            $('.vin-address[data-device-id="' + e.DeviceId + '"]').html((coords == null ? 'NA' : coords.address));
                            $('.vin-alarm[data-device-id="' + e.DeviceId + '"]').html(e.alarm);
                            $('.vin-address[data-device-id="' + e.DeviceId + '"]').html((coords == null ? 'NA' : (coords.geofence.length > 0 ? 'Yes' : 'No')));
                            
                            const index = _.findIndex(_vins, {vin: e.vin});
                            _markers[index].setLatLng([coords.lat, coords.lon]);
                            _latLngBounds.extend([coords.lat, coords.lon]);
                            generateShareLocationUrl(coords.lat, coords.lon, e.DeviceId);
                        }
                    });

                    if(_selectedIndex == -1) {
                        // _map.fitBounds(_latLngBounds);
                    } else {
                        selectVin(_selectedIndex);
                    }
                }
            } else showError('Token expired');
        } else showError(result.message);
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

function showError(message) {
    $.notifyClose();
    
    $.notify({
        message: message
    }, {
        type: 'danger',
        delay: 0,
        newest_on_top: false,
        placement: {
            from: 'top',
            align: 'right'
        },
        animate: {
            enter: 'animated fadeInDown',
            exit: 'animated fadeOutUp'
        },
        z_index: 9999
    });
}

function showSuccess(message) {
    $.notifyClose();
    
    $.notify({
        message: message
    }, {
        type: 'success',
        delay: 3000,
        newest_on_top: false,
        placement: {
            from: 'top',
            align: 'right'
        },
        animate: {
            enter: 'animated fadeInDown',
            exit: 'animated fadeOutUp'
        },
        z_index: 9999
    });
}