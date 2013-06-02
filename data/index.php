<?php
$f = 'data.txt';

if(isset($_REQUEST["data"])) {
	if(file_exists($f)) // backup old data
		rename($f, $f . date("-Ymd-His"));  
	$fp = fopen($f, 'w');
	fwrite($fp, $_REQUEST["data"]);
	fclose($fp);
} else {
	if(!file_exists($f)) {
		echo "[]";
	} else {
		readfile($f);
		exit;
	}
}
?>
