<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
require_once 'config.php';

$api_url = (ENV == 'production' ? 'http://localhost:5000/Traccar/Get_Token_InfoAsync' : 'https://gps.bataviarent.com/prime/iot/v1/api/Traccar/Get_Token_InfoAsync');
$api_key = 'XRFhwNDIyQDMxMzcyZTMyMmUzMlTclR21RaFh';
$api_secret = 'TclR2Y1dE4vdkNPT09GJwRzvKzhialRCTclRA';


if(isset($_POST['token'])) {
    $lang = 'en';
    $token = $_POST['token'];

    $arr_params = array(
        'lang' => 'en',
        'token' => $token
    );

    $json_params = json_encode($arr_params);

    $curl = curl_init($api_url);
    curl_setopt_array($curl, array(
        CURLOPT_CUSTOMREQUEST => 'POST',
        CURLOPT_POSTFIELDS => $json_params,
        CURLOPT_RETURNTRANSFER => 1,
        CURLOPT_HTTPHEADER => array(
            'Content-Type: application/json',
            'Content-Length: '.strlen($json_params),
            'api_key: '.$api_key,
            'api_secret: '.$api_secret
        )
    ));

    $response = curl_exec($curl);
    $err = curl_error($curl);
    $http_code = curl_getinfo($curl, CURLINFO_HTTP_CODE);

    curl_close($curl);

    if($http_code == '401') $json = array('result' => false, 'msg' => 'Unauthorized');

    if($err) $json = array('resut' => false, 'msg' => 'Unknown Error Occured');
    else $json = json_decode($response, TRUE);

    header('Content-Type: application/json');
    echo json_encode($json, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} else {
    $json = array('success' => false, 'message' => 'No token found');
    
    header('Content-Type: application/json');
    echo json_encode($json, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}