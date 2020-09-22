var _map = $('#map'),
    _deviceTableBody = $('#device-table tbody'),
    _vins = [];

var carIcon = L.icon({
    iconUrl: 'images/car-marker.png',
    iconSize: [35,45],
    iconAnchor: [17, 44]
});

$(function() {
    getPosition();
});

// function startup() {
//     if(navigator.geolocation) {
//         navigator.geolocation.getCurrentPosition(setMap);
//     } else alert('Please allow location request');
// }

function setMap(coords) {
    var map = L.map('map').setView([coords.lat, coords.lon], 15);
    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
            '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
            'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox/streets-v11',
        tileSize: 512,
        zoomOffset: -1,
        accessToken: 'pk.eyJ1IjoiZGV2LXB0ZGkiLCJhIjoiY2tmZHBnZWM5MDlqejJ6bmVxbWJndWowNCJ9.HdpiDmcwWSzPba_OrX3Rxw'
    }).addTo(map);

    L.marker([coords.lat, coords.lon], {icon: carIcon}).addTo(map);
}

function getPosition() {
    const url = 'http://gps.bataviarent.com/prime/iot/v1/api/Traccar/Get_Token_InfoAsync';
    const apiKey = 'XRFhwNDIyQDMxMzcyZTMyMmUzMlTclR21RaFh';
    const apiSecret = 'TclR2Y1dE4vdkNPT09GJwRzvKzhialRCTclRA';
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

            if(!payload.is_expired) {
                _deviceTableBody.empty();
                _vins = payload.vins;

                $.each(payload.vins, function(i, e) {
                    let html = '<tr>';
                    html += '<td class="btn-vin" data-vin="' + e.vin + '" style="cursor: pointer;">' + e.vin + '</td>';
                    html += '</tr>';

                    _deviceTableBody.append(html);
                });

                $('.btn-vin').on('click', function() {
                    const vin = $(this).data('vin');
                    const find = _.find(_vins, {vin: vin});
                    setMap(find.coords);
                });
            } else alert('Expired');
        } else alert(result.message);
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