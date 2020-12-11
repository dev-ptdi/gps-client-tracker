<?php
if(!isset($_GET['token'])) exit('Forbidden');

require_once 'config.php';
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tracker</title>
    <link rel="stylesheet" href="libs/bootstrap/css/bootstrap.min.css" />
    <link rel="stylesheet" href="libs/@fortawesome/fontawesome-free/css/all.min.css" />
    <link rel="stylesheet" href="libs/leaflet/leaflet.css" />
    <link rel="stylesheet" href="libs/animate.css/animate.min.css" />
    <link rel="stylesheet" href="style.css" />
</head>
<body>
    <div class="container-fluid pr-0 pl-0 h-100">
        <div class="row no-gutters h-100">
            <div id="map-wrapper" class="col-lg-9 col-12">
                <div id="map"></div>
            </div>
            <div id="sidebar" class="col-lg-3 col-12 p-3 border-right">
                <h4 class="ml-3 mr-3 mb-4">Vehicle List</h4>
                <button type="button" class="btn btn-primary mb-3" id="btn-recenter-map" onclick="refresh();" style="display: none;"><i class="fas fa-sync mr-2"></i>Re-Center Map</button>
                <div id="device-list"></div>
            </div>
        </div>
    </div>
    <script type="text/javascript">
        var _loadInverval = <?=LOAD_INTERVAL?>;
    </script>
    <script src="libs/jquery/jquery.min.js"></script>
    <script src="libs/popperjs/popper.min.js"></script>
    <script src="libs/bootstrap/js/bootstrap.min.js"></script>
    <script src="libs/lodash/lodash.min.js"></script>
    <script src="https://polyfill.io/v3/polyfill.min.js?features=default"></script>
    <script src="libs/leaflet/leaflet.js"></script>
    <script src="libs/leaflet-realtime/leaflet-realtime.js"></script>
    <script src="libs/jquery-number/jquery.number.min.js"></script>
    <script src="libs/bootstrap-notify/bootstrap-notify.min.js"></script>
    <script src="common.min.js"></script>
</body>
</html>