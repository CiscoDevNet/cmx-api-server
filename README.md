# CMX API Server #

The CMX API Server can receive notifications from one or multiple CMX servers. The listener will
then store and track the devices and location information. REST APIs can be used to
retrieve the active client information. Only the latest client location update will
be retained on the server. If the client is not updated for a period of time (default 20 minuts)
then the client will be removed from the cache. The CMX API Server will periodically log information
about the total client count being tracked and the number of messages being received from the
CMX servers.

# Installation #

  * First install node.js on a server. The image can be downloaded from <a href="http://nodejs.org/">http://nodejs.org/</a>
  * Install the CMX API Server by unziping the zip image **cisco-cmx-api-server-X-X-X.zip** into a directory
  * Install all the dependent node modules by running the command **npm install** in the installation directory
  * Install the certificates needed for the server by changing into the **cert_install** sub directory:
  * **Windows**
    * Run the script **certgen.bat** in the _cert_install_ directory
    * The script will prompt for information for the certificates and generate three files in the _config/certs_ directory: **server-cert.pem**, **server-csr.pem** and **server-key.pem**
  * **Linux**
    * Run the script **certgen.sh** in the _cert_install_ directory
    * The script will prompt for information for the certificates and generate three files in the _config/certs_ directory: **server-cert.pem**, **server-csr.pem** and **server-key.pem**
  
# Configuration #

Configuration needs to be done in CMX to send the notifications. Also the CMX API Server has
configuration settings which can be modified in the configuration file.

## CMX Configuration ##

In CMX a new notification needs to be created to send location updates to the running
CMX API Server. Create a notification with the following settings.

  * **Name** Enter a describing the notifications
  * **Type** Select _Location Update_
  * **Device Type** Select the device type. Preferred option is _All_ or _Client_
  * **Hierarchy** Select the hierarchy. Preferred option is _All Locations_
  * **Mac Address** Enter a MAC Address to filter upon. Preferred option is to leave the field blank
  * **Receiver** Use _https_ option with the server IP and default port is _9094_. The URI is _api/v1/notify/location_
  * **MAC Hashing** MAC hashing should be _OFF_
  * **Message Format** Select _JSON_

## CMX API Server Configuration ##

The default configuration settings can be modified in the file location in **config/options.js**
file. The settings in the file are the following.

  * **NOTIFY_WEB_PORT** [9094] Web server port to listen for notifications
  * **REST_WEB_PORT** [9095] Web server port to listen for REST API requests
  * **DO_HTTPS** [true] Should the web server start using HTTPS
  * **NUMBER_NOTIFY_WORKERS** [5] Number of workers for the notification processing
  * **NUMBER_REST_WORKERS** [2] Number of workers for the REST API handling
  * **CURRENT_DEVICE_TTL** [1200] Number of seconds before removing device from current cache if not updated
  * **CURRENT_DEVICE_CHECK_PERIOD** [120] Number of seconds before checking for current devices to be removed
  * **NOTIFY_TTL** [1200] Number of seconds before removing notify sources if not updated
  * **NOTIFY_CHECK_PERIOD** [120] Number of seconds before checking for notify sources to be removed
  * **REST_TTL** [1200] Number of seconds before removing REST sources if not updated
  * **REST_CHECK_PERIOD** [120] Number of seconds before checking for REST sources to be removed
  * **ASYNC_LIMIT** [5000] Maximum number of async operations at a time
  * **LOG_SUMMARY_INFO_STATS_INTERVAL** [1800] Number of seconds between logging detail information stats
  * **DO_API_AUTHENTICATION** [true] Should API authentication be done
  * **CMX_API_USERID** [api] REST api basic authentication user ID
  * **CMX_API_PASSWORD** [api] REST api basic authentication password
  
# Running CMX API Server #

To start the server running you can run the command **npm start** in the installation directory.
When the shell terminates so will the CMX API Server when using npm start command.
A Node.js process manager can be used to run the server as a daemon.
The suggested one to be used is named PM2.

## PM2 ##

**Installation**

Run the command **npm install pm2 -g** to install on the system

**Starting CMX API Server**

Run the command **pm2 start bin/cmxApiServer** in the installation directory.

** Logs **

CMX API Server will log messages to the console by default. To view the logs run the command **pm2 log**

** Monitor **

If you wish to monitor the CPU and memory of the server then run the command **pm2 monit**

# REST APIs #

The CMX API Server has REST APIs to query for information while receiving CMX notifications. The
following are the REST APIs.

  * **/api/v3/location/clients** Returns all the current clients attributes. Any client which has not been updated
  by the configuration setting **CURRENT_DEVICE_TTL** will be removed from the cache.
    * The API supports the optional parameter **ipAddress**. This will filter clients based
    upon the clients IP address.
    * The API supports the optional parameter **macAddress**. This will filter clients based
    upon the clients MAC address.
    * The API supports the optional parameter **mapHierarchy**. This will filter clients based
    upon the clients floor location map hierarchy _locationMapHierarchy_.
    * The API supports the optional parameter **floorRefId**. This will filter clients based
    upon the clients floor ID.
    * The API supports the optional parameter **ssid**. This will filter clients based
    upon the clients SSID.
    * The API supports the optional parameter **username**. This will filter clients based
    upon the clients user name.
    * The API supports the optional parameter **manufacturer**. This will filter clients based
    upon the clients manufacturer.
    * The API supports the optional parameter **macAddressSearch**. This will filter clients based
    upon the clients partial MAC address.

  * **/api/v3/location/clients/count** Returns the count of all the current clients. Any client which has not been updated
  by the configuration setting **CURRENT_DEVICE_TTL** will be removed from the cache.
    * The API supports the optional parameter **ipAddress**. This will filter clients based
    upon the clients IP address.
    * The API supports the optional parameter **macAddress**. This will filter clients based
    upon the clients MAC address.
    * The API supports the optional parameter **mapHierarchy**. This will filter clients based
    upon the clients floor location map hierarchy _locationMapHierarchy_.
    * The API supports the optional parameter **floorRefId**. This will filter clients based
    upon the clients floor ID.
    * The API supports the optional parameter **ssid**. This will filter clients based
    upon the clients SSID.
    * The API supports the optional parameter **username**. This will filter clients based
    upon the clients user name.
    * The API supports the optional parameter **manufacturer**. This will filter clients based
    upon the clients manufacturer.
    * The API supports the optional parameter **macAddressSearch**. This will filter clients based
    upon the clients partial MAC address.
    
  * **/api/v1/config/version** Returns the version information for the CMX API Server.

  * **/api/v1/metrics/notifications** Returns the metrics for CMX notifications sent to the CMX API Server.

  * **/api/v1/metrics/apis** Returns the metrics for CMX REST API requests to the CMX API Server.


# Building CMX API Server #

Building a CMX API Server can be done to create and install package which can be used on other servers.
Building is not part of the process for running the CMX API Server but only needed to create an install image.
**Grunt** is required build the CMX API Server.

**Grunt Installation**

To install Grunt run the command **npm install grunt-cli -g**

**Build Command**

To build the server run the command **grunt**. Two new directories are created as part of the build.
**dist** is the stagging location for the distribution image. The directory structure and files in this directory
will be used for the distribution image. **target** will contain the install image for the CMX API Server.