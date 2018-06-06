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
CMX API Server. A second notification needs to be created to send absence events for
clients no longer being tracked in CMX. Create the location update notification with the following settings.

  * **Name** Enter a describing the notifications
  * **Type** Select _Location Update_
  * **Device Type** Select the device type. Preferred option is _Client_
  * **Hierarchy** Select the hierarchy. Preferred option is _All Locations_
  * **Mac Address** Enter a MAC Address to filter upon. Preferred option is to leave the field blank
  * **Receiver** Use _https_ option with the server IP and default port is _9094_. The URI is _api/notify/v1/location_
  * **MAC Hashing** MAC hashing should be _OFF_
  * **Message Format** Select _JSON_

Create the absence event notification with the following settings

  * **Name** Enter a describing the notifications
  * **Type** Select Absence_
  * **Device Type** Select the device type. Preferred option is _Client_
  * **Mac Address** Enter a MAC Address to filter upon. Preferred option is to leave the field blank
  * **Receiver** Use _https_ option with the server IP and default port is _9094_. The URI is _api/notify/v1/absence
  * **MAC Hashing** MAC hashing should be _OFF_
  * **Message Format** Select _JSON_

## CMX API Server Configuration ##

The default configuration settings can be modified in the file location in **config/default.json**
file. The settings in the file are the following.

  * _**server**_
    * **doHttps** [true] Should the web server start using HTTPS
    * **asyncLimit** [5000] Maximum number of async operations at a time
    * **logStatsInterval** [1800] Number of seconds between logging detail information stats
  * _**notifications**_
    * **port** [9094] Web server port to listen for notifications
    * **workers** [5] Number of workers for the notification processing
    * **metricTtl** [1200] Number of seconds before removing notify sources if not updated
    * **metricCheckInterval** [120] Number of seconds before checking for notify sources to be removed
  * _**restApi**_
    * **port** [9095] Web server port to listen for REST API requests
    * **workers** [2] Number of workers for the REST API handling
    * **metricTtl** [1200] Number of seconds before removing REST sources if not updated
    * **metricCheckInterval** [120] Number of seconds before checking for REST sources to be removed
  * _**device**_
    * **ttl** [172800] Number of seconds before removing device from current cache if not updated
    * **checkInterval** [600] Number of seconds before checking for current devices to be removed
  * _**authentication**_
    * **doApiAuthentication** [true] Should API authentication be done
    * **apiAuthenticationSalt** [a8302c3f35edb347] Salt used to hash password
  * _**users**_
    * **userId** [api] REST api basic authentication user ID
    * **password** [api] REST api basic authentication password hashed
  
To change **userId** use the REST API **/api/config/v1/hash** to hash the password and
set the value based upon the returned hash number. **password** should be updated when a new
password is set. Change the salt to a new 16 hexadecimal number.
  
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

  * **/api/location/v3/clients** Returns all the current clients attributes. Any client which has not been updated
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
    * The API supports the optional parameter **associatedOnly**. The parameter should be set to _true_.
    Any other value is considered false. This will filter for associated clients when true and probing only clients if false.
    * The API supports the optional parameter **probingOnly**. The parameter should be set to _true_.
    Any other value is considered false. This will filter for probing only clients when true and associated only clients if false.

  * **/api/location/v3/clients/count** Returns the count of all the current clients. Any client which has not been updated
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
    * The API supports the optional parameter **associatedOnly**. The parameter should be set to _true_.
    Any other value is considered false. This will filter for associated clients when true and probing only clients if false.
    * The API supports the optional parameter **probingOnly**. The parameter should be set to _true_.
    Any other value is considered false. This will filter for probing only clients when true and associated only clients if false.
    
  * **/api/config/v1/version** Returns the version information for the CMX API Server.
  * **/api/config/v1/hash** Returns the hashed password based upon the salt provided.
    * The API supports the parameter **salt**. This is the salt to use to hash the password.
    * The API supports the parameter **password**. Password to hash based upon the salt.

  * **/api/metrics/v1/notifications** Returns the metrics for CMX notifications sent to the CMX API Server.

  * **/api/metrics/v1/apis** Returns the metrics for CMX REST API requests to the CMX API Server.


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