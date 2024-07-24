<?php
require_once $_SERVER['DOCUMENT_ROOT'] . '/globals.php';

function db_connect() {
  $dbstr = "(DESCRIPTION =(ADDRESS = (PROTOCOL = TCP)(HOST = {$GLOBALS['DBHOST']} )(PORT = {$GLOBALS['DBPORT']} )) (CONNECT_DATA = (SERVER = DEDICATED) (SERVICE_NAME = {$GLOBALS['DBSERVICE']} ) ))";
  $conn = oci_pconnect($GLOBALS['USERNAME'] , $GLOBALS['PASSWORD'] , $dbstr) ;
  return $conn; 
}

function db_disconnect($conn) {
  if(isset($conn)) 
  {
    oci_close($conn);     //<--PHP Warning:  oci_close() expects parameter 1 to be resource, bool given 
  }
}

function db_escape($conn, $string) {
  //return mysqli_real_escape_string($conn, $string);
}

function confirm_db_connect() {
  if(oci_error($db)) 
  {
    $msg = "Database connection failed: ";
    $msg .= oci_error($db);
    exit($msg);
  }
}

function confirm_result_set($data) {
  if (!$data) 
  {
    exit("Database query failed.");
  }
}
?>
