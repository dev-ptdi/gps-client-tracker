var _apiUrl = null,
    _apiKey = 'XRFhwNDIyQDMxMzcyZTMyMmUzMlTclR21RaFh',
    _apiSecret = 'TclR2Y1dE4vdkNPT09GJwRzvKzhialRCTclRA',
    _mapBoxPublicToken = 'pk.eyJ1IjoiZGV2LXB0ZGkiLCJhIjoiY2tmZHBnZWM5MDlqejJ6bmVxbWJndWowNCJ9.HdpiDmcwWSzPba_OrX3Rxw',
    _map = null,
    _realtime = null,
    _deviceList = $('#device-list'),
    _vins = [],
    _markerPos = [],
    _markers = [],
    // _latLngBounds,
    // _markerIcon,
    // _markerIconFocus,
    // _refreshIcon,
    // _refreshButton,
    _selectedVin = null,
    _selectedIndex = -1;

$(function() {
    $.getJSON('config.json', function(result) {
        if(result.environment === 'development') _apiUrl = 'http://gps.bataviarent.com/prime/iot/v1/api/Traccar/Get_Token_InfoAsync';
        else if(result.environment === 'production') _apiUrl = 'http://localhost:5000/Traccar/Get_Token_InfoAsync';

        if(navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(pos) {
                const coords = pos.coords;

                _map = L.map('map').setView([coords.latitude, coords.longitude], 13);

                L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
                    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
                    maxZoom: 18,
                    id: 'mapbox/streets-v11',
                    tileSize: 512,
                    zoomOffset: -1,
                    accessToken: _mapBoxPublicToken,
                }).addTo(_map);

                getLocations();
            }, function(err) {
                alert('Maps Error: ' + err);
            });
        } else alert('Please allow location request');
    });
});

function getLocations() {
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
            _markers = [];

            if(!payload.is_expired) {
                _deviceList.empty();
                _vins = payload.vins;

                if(_vins.length > 0) {
                    $.each(_vins, function(i, e) {
                        const coords = e.coords;

                        let html = '<div class="card mb-3">';
                        html += '<div class="card-header" id="heading-' + e.vin + '">';
                        html += '<h5 class="mb-0">';
                        html += '<button class="btn btn-link" data-toggle="collapse" data-target="#collapse-' + e.vin + '" aria-expanded="true" aria-controls="collapse-' + e.vin + '">' + e.name + '</button>'
                        html += '</h5>';
                        html += '</div>';
                        html += '<div id="collapse-' + e.vin + '" class="collapse ' + (i === 0 ? 'show' : '') + '" aria-labelledby="heading-' + e.vin + '" data-parent="#device-list">';
                        html += '<div class="card-body">';
                        html += '<table class="table table-bordered table-hover table-sm mb-0 small">';
                        html += '<tr><td style="width: 25%;">Plate Number</td><td class="text-right font-weight-bold">' + e.name + '</td></tr>';
                        html += '<tr><td>VIN</td><td class="text-right">' + e.vin + '</td></tr>';
                        html += '<tr><td>Status</td><td class="text-right ' + (e.status === 'offline' ? 'text-danger' : (e.status === 'online' ? 'text-success' : 'text-warning')) + '">' + e.status + '</td></tr>';
                        html += '<tr><td>Ignition</td><td class="text-right">' + (e.ignition ? 'On' : 'Off') + '</td></tr>';
                        html += '<tr><td>Signal Strength</td><td class="text-right">' + (e.rssi / 5) * 100 + '%</td></tr>';
                        html += '<tr><td>Battery Level</td><td class="text-right">' + e.battery + '%</td></tr>';
                        html += '<tr><td>Speed</td><td class="text-right">' + $.number(coords.speed / 1000, 2) + ' KM/H</td></tr>';
                        html += '<tr><td>Odometer</td><td class="text-right">' + $.number(e.odometer / 1000, 2) + ' KM</td></tr>';
                        html += '<tr><td>Total Distance</td><td class="text-right">' + $.number(e.total_distance / 1000) + ' KM/H</td></tr>';
                        html += '<tr><td>Latitude</td><td class="text-right">' + coords.lat + '</td></tr>';
                        html += '<tr><td>Longitude</td><td class="text-right">' + coords.lon + '</td></tr>';
                        html += '<tr><td>Accuracy</td><td class="text-right">' + coords.accuracy + '</td></tr>';
                        html += '<tr><td>Address</td><td class="text-right">' + coords.address + '</td></tr>';
                        html += '<tr><td>Alarm</td><td class="text-right text-danger font-weight-bold">' + e.alarm + '</td></tr>';
                        html += '<tr><td>Geofence</td><td class="text-right">' + (coords.geofence.length > 0 ? 'Yes' : 'No') + '</td></tr>';
                        html += '</table>';
                        html += '</div>';
                        html += '</div>';
                        html += '</div>';

                        _deviceList.append(html);
                    });
                }
            } else alert('Token expired');
        } else alert(result.msg);
    });
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