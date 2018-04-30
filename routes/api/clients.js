var config = require('config');
var express = require('express');
var router = express.Router();
var logger = require(__base + 'config/logger');
var Metrics = require(__base + 'lib/metrics');
var util = require('util');
var async = require('async');

module.exports = function(passport, currentDeviceCache, restSourceCache) {

    var urlMetrics = new Metrics(restSourceCache);

    //-----------------------------------------------------------------------
    //Function: getClientFilter
    //
    //Description: Get the client filter settings based upon the request
    //
    //Parameters: req - HTTP request object
    //
    //Returns: Client filter object
    //-----------------------------------------------------------------------
    function getClientFilter(req) {
        var clientFilter = {};
        clientFilter.clientFilterCount = 0;
        clientFilter.clientMacFilterSelected = false;
        clientFilter.clientIpAddressFilterSelected = false;
        clientFilter.clientMapHierarchyFilterSelected = false;
        clientFilter.clientSsidFilterSelected = false;
        clientFilter.clientUsernameFilterSelected = false;
        clientFilter.clientManufacturerFilterSelected = false;
        clientFilter.clientMacAddressSearchFilterSelected = false;
        clientFilter.clientAssociatedOnlySelected = false;
        clientFilter.clientProbingOnlySelected = false;

        if (req.query['macAddress'] !== undefined) {
            clientFilter.clientMacFilterSelected = true;
            ++clientFilter.clientFilterCount;
            clientFilter.clientMacFilterString = req.query['macAddress'];
        }
        if (req.query['ipAddress'] !== undefined) {
            clientFilter.clientIpAddressFilterSelected = true;
            ++clientFilter.clientFilterCount;
            clientFilter.clientIpAddressFilterString = req.query['ipAddress'];
        }
        if (req.query['mapHierarchy'] !== undefined) {
            clientFilter.clientMapHierarchyFilterSelected = true;
            ++clientFilter.clientFilterCount;
            clientFilter.clientMapHierarchyFilterString = req.query['mapHierarchy'];
        }
        if ( req.query['floorRefId'] !== undefined) {
            clientFilter.clientFloorRefIdFilterSelected = true;
            ++clientFilter.clientFilterCount;
            clientFilter.clientFloorRefIdFilterString =  req.query['floorRefId'];
        }
        if (req.query["ssid"] !== undefined) {
            clientFilter.clientSsidFilterSelected = true;
            ++clientFilter.clientFilterCount;
            clientFilter.clientSsidFilterString = req.query["ssid"];
        }
        if (req.query["username"] !== undefined) {
            clientFilter.clientUsernameFilterSelected = true;
            ++clientFilter.clientFilterCount;
            clientFilter.clientUsernameFilterString = req.query["username"];
        }
        if (req.query["manufacturer"] !== undefined) {
            clientFilter.clientManufacturerFilterSelected = true;
            ++clientFilter.clientFilterCount;
            clientFilter.clientManufacturerFilterString = req.query["manufacturer"];
        }
        if ( req.query['macAddressSearch'] !== undefined) {
            clientFilter.clientMacAddressSearchFilterSelected = true;
            ++clientFilter.clientFilterCount;
            clientFilter.clientMacAddressSearchFilterString =  req.query['macAddressSearch'];
        }
        if ( req.query['associatedOnly'] !== undefined) {
            clientFilter.clientAssociatedOnlySelected = true;
            ++clientFilter.clientFilterCount;
            clientFilter.clientAssociatedOnlyFilterBoolean =  (req.query['associatedOnly'] === 'true');
        }
        if ( req.query['probingOnly'] !== undefined) {
            clientFilter.clientProbingOnlySelected = true;
            ++clientFilter.clientFilterCount;
            clientFilter.clientProbingOnlyFilterBoolean =  (req.query['probingOnly'] === 'true');
        }
        return clientFilter;
    }

    //-----------------------------------------------------------------------
    //Function: clientSearch
    //
    //Description: Get the client filter settings based upon the request
    //
    //Parameters: clientFilter - Client filter object
    //            client       - Client object in the cache
    //
    //Returns: True if the client matched the search criteria
    //-----------------------------------------------------------------------
    function clientSearch(clientFilter, client) {
        if (clientFilter.clientIpAddressFilterSelected) {
            if (client.ipAddress === undefined || client.ipAddress[0] === undefined || clientFilter.clientIpAddressFilterString === undefined || (clientFilter.clientIpAddressFilterString !== client.ipAddress[0] && (client.ipAddress[1] === undefined || clientFilter.clientIpAddressFilterString !== client.ipAddress[1]) && (client.ipAddress[2] === undefined || clientFilter.clientIpAddressFilterString !== client.ipAddress[2]))) {
                return false;
            }
        }
        if (clientFilter.clientMapHierarchyFilterSelected) {
            if (clientFilter.clientMapHierarchyFilterString === undefined || client.locationMapHierarchy.search(clientFilter.clientMapHierarchyFilterString) < 0) {
                return false;
            }
        }
        if (clientFilter.clientFloorRefIdFilterSelected) {
            if (client.floorRefId === undefined || clientFilter.clientFloorRefIdFilterString === undefined || clientFilter.clientFloorRefIdFilterString !== client.floorRefId) {
                return false;
            }
        }
        if (clientFilter.clientSsidFilterSelected) {
            if (client.ssid === undefined || clientFilter.clientSsidFilterString === undefined || clientFilter.clientSsidFilterString !== client.ssid) {
                return false;
            }
        }
        if (clientFilter.clientUsernameFilterSelected) {
            if (client.username === undefined || clientFilter.clientUsernameFilterString === undefined || clientFilter.clientUsernameFilterString !== client.username) {
                return false;
            }
        }
        if (clientFilter.clientManufacturerFilterSelected) {
            if (client.manufacturer === undefined || clientFilter.clientManufacturerFilterString === undefined || clientFilter.clientManufacturerFilterString !== client.manufacturer) {
                return false;
            }
        }
        if (clientFilter.clientMacAddressSearchFilterSelected) {
            if (clientFilter.clientMacAddressSearchFilterString === undefined || client.deviceId.search(clientFilter.clientMacAddressSearchFilterString) < 0) {
                return false;
            }
        }
        if (clientFilter.clientAssociatedOnlySelected) {
            if (client.associated === undefined || clientFilter.clientAssociatedOnlyFilterBoolean === undefined || clientFilter.clientAssociatedOnlyFilterBoolean !== client.associated) {
                return false;
            }
        }
        if (clientFilter.clientProbingOnlySelected) {
            if (client.associated === undefined || clientFilter.clientProbingOnlyFilterBoolean === undefined || clientFilter.clientProbingOnlyFilterBoolean === client.associated) {
                return false;
            }
        }
        return true;
    }

    //-----------------------------------------------------------------------
    //Get Listener: /api/location/v3/clients/count
    //
    //Description: Will return the current client count
    //-----------------------------------------------------------------------
    router.get('/count', passport.authenticate(passport.cmx_strategy, { session : false }), function(req, res, next) {
        var requestIp = req.ip;
        if (requestIp !== undefined) {
            requestIp = req.ip.replace(/^.*:/, '');
        } else {
            requestIp = 'Unknown';
        }
        logger.info("Worker [%s]: Client count request from: %s queries: %s", process.env.WORKER_ID, requestIp, util.inspect(req.query, {depth: null}));
        urlMetrics.incrementUrlCounter(requestIp, "/api/v3/location/clients/count");
        var jsonData = {};
        var clientFilter = getClientFilter(req);
        if (Object.keys(req.query).length !== clientFilter.clientFilterCount) {
            jsonData.success = false;
            jsonData.error = {};
            jsonData.error.message = "Unkown filter parameter being used";
            return res.status(400).json(jsonData);
        }
        var totalClientCount = 0;
        var associatedCount = 0;
        var probingCount = 0;
        if (clientFilter.clientMacFilterSelected) {
            if (Object.keys(req.query).length > 1) {
                jsonData.success = false;
                jsonData.error = {};
                jsonData.error.message = "MAC filter does not support multiple filters";
                return res.status(400).json(jsonData);
            }
            currentDeviceCache.get("MAC:" + clientFilter.clientMacFilterString).then(function (currentDeviceCacheResults) {
                var clientCountObj = {};
                if (currentDeviceCacheResults.value !== undefined) {
                    ++totalClientCount;
                    if (currentDeviceCacheResults.value.associated) {
                        ++associatedCount;
                    } else {
                        ++probingCount;
                    }
                }
                clientCountObj.totalCount = totalClientCount;
                clientCountObj.associatedCount = associatedCount;
                clientCountObj.probingCount = probingCount;
                logger.info("Worker [%s]: Completed count request from: %s with object: %s", process.env.WORKER_ID, requestIp, util.inspect(clientCountObj, {depth: null}));
                return res.json(clientCountObj);
            });
        } else if (clientFilter.clientIpAddressFilterSelected) {
                if (Object.keys(req.query).length > 1) {
                    jsonData.success = false;
                    jsonData.error = {};
                    jsonData.error.message = "IP Address filter does not support multiple filters";
                    return res.status(400).json(jsonData);
                }
                currentDeviceCache.get("IP:" + clientFilter.clientIpAddressFilterString).then(function(currentKeyCacheResults) {
                    currentDeviceCache.get("MAC:" + currentKeyCacheResults.value).then(function(currentDeviceCacheResults) {
                        var clientCountObj = {};
                        if (currentDeviceCacheResults.value !== undefined) {
                            ++totalClientCount;
                            if (currentDeviceCacheResults.value.associated) {
                                ++associatedCount;
                            } else {
                                ++probingCount;
                            }
                        }
                        clientCountObj.totalCount = totalClientCount;
                        clientCountObj.associatedCount = associatedCount;
                        clientCountObj.probingCount = probingCount;
                        logger.info("Worker [%s]: Completed count request from: %s with object: %s", process.env.WORKER_ID, requestIp, util.inspect(clientCountObj, {depth: null}));
                        return res.json(clientCountObj);
                    });
                });
        } else {
            currentDeviceCache.keys().then(function(currentDeviceCacheKeysResults) {
                if (!currentDeviceCacheKeysResults.err) {
                    var clientCountObj = {};
                    async.eachLimit(currentDeviceCacheKeysResults.keys, config.get('server.asyncLimit'), function (deviceKey, callback) {
                        try {
                            if (deviceKey.indexOf("MAC:") === 0) {
                                logger.debug("Worker [%s]: Get key in the cache: %s", process.env.WORKER_ID, deviceKey);
                                currentDeviceCache.get(deviceKey).then(function(currentDeviceCacheResults) {
                                    try {
                                        if (!currentDeviceCacheResults.err) {
                                            var value = currentDeviceCacheResults.value;
                                            if (value !== undefined && value.sourceNotification !== undefined && value.deviceId !== undefined) {
                                                logger.debug("Worker [%s]: Processing client for count: %s", process.env.WORKER_ID, value.deviceId);
                                                if (clientSearch(clientFilter, value)) {
                                                    logger.debug("Worker [%s]: Increment count for: %s", process.env.WORKER_ID, value.deviceId);
                                                    ++totalClientCount;
                                                    if (value.associated) {
                                                        ++associatedCount;
                                                    } else {
                                                        ++probingCount;
                                                    }
                                                }
                                                callback();
                                            } else {
                                                callback();

                                            }
                                        } else {
                                            callback();
                                        }
                                    } catch (err) {
                                        logger.error("Worker [%s]: Errors while processing device %s from the cache for client count: %s", process.env.WORKER_ID, deviceKey, err.message);
                                        callback();
                                    }
                                });
                            }
                        } catch (err) {
                            logger.error("Worker [%s]: Errors while getting device %s from the cache for client count: %s", process.env.WORKER_ID, deviceKey, err.message);
                            callback();
                        }
                    }, function(err) {
                        clientCountObj.totalCount = totalClientCount;
                        clientCountObj.associatedCount = associatedCount;
                        clientCountObj.probingCount = probingCount;
                        logger.info("Worker [%s]: Completed count request from: %s with object: %s", process.env.WORKER_ID, requestIp, util.inspect(clientCountObj, {depth: null}));
                        return res.json(clientCountObj);
                    });
                } else {
                    logger.error("Worker [%s]: Error while getting keys for client count: %s", process.env.WORKER_ID, err);
                }
            });
        }
    });

    //-----------------------------------------------------------------------
    //Get Listener: /api/location/v3/clients
    //
    //Description: Will return the current clients in an array of client JSON objects
    //-----------------------------------------------------------------------
    router.get('/', passport.authenticate(passport.cmx_strategy, { session : false }), function(req, res, next) {
        var requestIp = req.ip;
        if (requestIp !== undefined) {
            requestIp = req.ip.replace(/^.*:/, '');
        } else {
            requestIp = 'Unknown';
        }
        logger.info("Worker [%s]: Client search request from: %s queries: %s", process.env.WORKER_ID, requestIp, util.inspect(req.query, {depth: null}));
        urlMetrics.incrementUrlCounter(requestIp, "/api/v3/location/clients");
        var jsonData = {};
        var clientFilter = getClientFilter(req);
        if (Object.keys(req.query).length !== clientFilter.clientFilterCount) {
            jsonData.success = false;
            jsonData.error = {};
            jsonData.error.message = "Unkown filter parameter being used";
            return res.status(400).json(jsonData);
        }
        if (clientFilter.clientMacFilterSelected) {
            if (Object.keys(req.query).length > 1) {
                jsonData.success = false;
                jsonData.error = {};
                jsonData.error.message = "MAC filter does not support multiple filters";
                return res.status(400).json(jsonData);
            }
            currentDeviceCache.get("MAC:" + clientFilter.clientMacFilterString).then(function (currentDeviceCacheResults) {
                var clientObjArray = [];
                if (currentDeviceCacheResults.value !== undefined) {
                    clientObjArray.push(currentDeviceCacheResults.value);
                }
                logger.info("Worker [%s]: Completed client search request from: %s", process.env.WORKER_ID, requestIp);
                return res.json(clientObjArray);
            });
        } else if (clientFilter.clientIpAddressFilterSelected) {
            if (Object.keys(req.query).length > 1) {
                jsonData.success = false;
                jsonData.error = {};
                jsonData.error.message = "IP Address filter does not support multiple filters";
                return res.status(400).json(jsonData);
            }
            currentDeviceCache.get("IP:" + clientFilter.clientIpAddressFilterString).then(function(currentKeyCacheResults) {
                currentDeviceCache.get("MAC:" + currentKeyCacheResults.value).then(function(currentDeviceCacheResults) {
                    var clientObjArray = [];
                    if (currentDeviceCacheResults.value !== undefined) {
                        clientObjArray.push(currentDeviceCacheResults.value);
                    }
                    logger.info("Worker [%s]: Completed client search request from: %s", process.env.WORKER_ID, requestIp);
                    return res.json(clientObjArray);
                });
            });
        } else {
            res.writeHeader(200, {
                'content-type': 'application/json'
              });
            res.write('[');
            var firstObject = true;
            currentDeviceCache.keys().then(function(currentDeviceCacheKeysResults) {
                if (!currentDeviceCacheKeysResults.err) {
                    async.eachLimit(currentDeviceCacheKeysResults.keys, config.get('server.asyncLimit'), function (deviceKey, callback) {
                        try {
                            if (deviceKey.indexOf("MAC:") === 0) {
                                logger.debug("Worker [%s]: Get key in the cache: %s", process.env.WORKER_ID, deviceKey);
                                currentDeviceCache.get(deviceKey).then(function (currentDeviceCacheResults) {
                                    try {
                                        if (!currentDeviceCacheResults.err) {
                                            var value = currentDeviceCacheResults.value;
                                            if (value !== undefined && value.sourceNotification !== undefined && value.deviceId !== undefined) {
                                                logger.debug("Worker [%s]: Processing client for count: %s", process.env.WORKER_ID, value.deviceId);
                                                if (clientSearch(clientFilter, value)) {
                                                    logger.debug("Worker [%s]: Add client search for: %s", process.env.WORKER_ID, value.deviceId);
                                                    if (!firstObject) {
                                                        res.write(',');
                                                    } else {
                                                        firstObject = false;
                                                    }
                                                    res.write(JSON.stringify(value));
                                                }
                                                callback();
                                            } else {
                                                callback();
                                            }
                                        } else {
                                            callback();
                                        }
                                    } catch (err) {
                                        logger.error("Worker [%s]: Errors while processing device %s from the cache for client search: %s", process.env.WORKER_ID, deviceKey, err.message);
                                        callback();
                                    }
                                });
                            }
                        } catch (err) {
                            logger.error("Worker [%s]: Errors while getting device %s from the cache for client search: %s", process.env.WORKER_ID, deviceKey, err.message);
                            callback();
                        }
                    }, function(err) {
                        logger.info("Worker [%s]: Completed client search request from: %s", process.env.WORKER_ID, requestIp);
                        return res.end(']');
                    });
                } else {
                    logger.error("Worker [%s]: Error while getting keys for client search: %s", process.env.WORKER_ID, err);
                }
            });
        }
    });

    return router;
};
