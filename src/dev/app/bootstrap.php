<?php

use \Nette\Application\Routers\Route;
//use \Nette\Application\UI\Form;
use Nette\Forms\Container;

// Load Nette Framework or autoloader generated by Composer
require __DIR__ . '/../libs/autoload.php';

$configurator = new Nette\Config\Configurator;

// Enable Nette Debugger for error visualisation & logging
//$configurator->setDebugMode(TRUE);
$configurator->enableDebugger(__DIR__ . '/../log');

// Specify folder for cache
$configurator->setTempDirectory(__DIR__ . '/../temp');

// Enable RobotLoader - this will load all classes automatically
$configurator->createRobotLoader()
		->addDirectory(__DIR__)
		->addDirectory(__DIR__ . '/../libs')
		->register();

// Select the environment

if ($_SERVER["SERVER_NAME"] == "toulavej.loc") { // development @ local network
	$configurator->addParameters(array("environment" => "development"));
} else if ($_SERVER["SERVER_NAME"] == "94.143.173.89") {
	$configurator->addParameters(array("environment" => "development"));
} else if ($_SERVER["SERVER_NAME"] == "shaitan666.asuscomm.com") {
	$configurator->addParameters(array("environment" => "development"));
} else if ($_SERVER["SERVER_NAME"] == "geo102.fsv.cvut.cz") {
	$configurator->addParameters(array("environment" => "production"));
}

// Create Dependency Injection container from config.neon file
$configurator->addConfig(__DIR__ . '/config/config.neon');
$container = $configurator->createContainer();

$container->router[] = new Route("index.php", "Front:default", Route::ONE_WAY);
$container->router[] = new Route("<presenter>/<action>[/<id>]", "Front:default");



return $container;
