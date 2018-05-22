var config = require('config');
var Table = require('cli-table');
var async = require('async');
var logger = require(__base + 'config/logger');

module.exports = function(metricsCache) {

    var Metrics = {};
    var tableStyling =  { head: [], border: [] };
    var privateUrlCounter = {};
    var lastLogUrlMetricsDate = new Date();
    var lastCleanupMetricsDate = new Date();

    //-----------------------------------------------------------------------
    //Function: cleanUp
    //
    //Description: Cleanup private URL counter of any removed keys
    //
    //Parameters: None
    //
    //Returns: None
    //-----------------------------------------------------------------------
    function cleanUp() {
        for (var sourceAddress in privateUrlCounter) {
            for (var requestUrl in privateUrlCounter[sourceAddress]) {
                var cacheKey = process.env.WORKER_ID  + "," + sourceAddress + "," + requestUrl;
                /* jshint ignore:start */
                metricsCache.get(cacheKey).then(function(cacheResults) {
                    var privateSourceAddress = sourceAddress;
                    var privateRequestUrl = requestUrl;
                    if (cacheResults === undefined || cacheResults.value === undefined) {
                        delete privateUrlCounter[privateSourceAddress][privateRequestUrl];
                        if (privateUrlCounter[privateSourceAddress].length <= 0) {
                            delete privateUrlCounter[privateSourceAddress];
                        }
                    }
                });
                /* jshint ignore:end */
            }
        }
        lastCleanupMetricsDate = Date.now();
    }

    //-----------------------------------------------------------------------
    //Function: incrementUrlCounter
    //
    //Description: Increment the URL counter
    //
    //Parameters: sourceAddress - Source address for the URL
    //            requestUrl    - URL
    //
    //Returns: None
    //-----------------------------------------------------------------------
    Metrics.incrementUrlCounter = function(sourceAddress, requestUrl) {
        var cacheKey = process.env.WORKER_ID  + "," + sourceAddress + "," + requestUrl;
        metricsCache.get(cacheKey).then(function(cacheResults) {
            var urlCounterCache = cacheResults.value;
            if (urlCounterCache !== undefined && urlCounterCache.sourceAddress !== undefined) {
                if (privateUrlCounter[sourceAddress] === undefined) {
                    privateUrlCounter[sourceAddress] = {};
                }
                if (privateUrlCounter[sourceAddress][requestUrl] === undefined) {
                    privateUrlCounter[sourceAddress][requestUrl] = {};
                    privateUrlCounter[sourceAddress][requestUrl].currentCounter = 0;
                    privateUrlCounter[sourceAddress][requestUrl].totalCounter = 0;
                }
                if (urlCounterCache.currentCounter === 0) {
                    privateUrlCounter[sourceAddress][requestUrl].currentCounter = 0;
                }
                if (urlCounterCache.totalCounter === 0) {
                    privateUrlCounter[sourceAddress][requestUrl].totalCounter = 0;
                }
                ++privateUrlCounter[sourceAddress][requestUrl].currentCounter;
                urlCounterCache.currentCounter =  privateUrlCounter[sourceAddress][requestUrl].currentCounter;
                ++privateUrlCounter[sourceAddress][requestUrl].totalCounter;
                urlCounterCache.totalCounter =  privateUrlCounter[sourceAddress][requestUrl].totalCounter;
            } else {
                if (privateUrlCounter[sourceAddress] === undefined) {
                    privateUrlCounter[sourceAddress] = {};
                }
                if (privateUrlCounter[sourceAddress][requestUrl] === undefined) {
                    privateUrlCounter[sourceAddress][requestUrl] = {};
                    privateUrlCounter[sourceAddress][requestUrl].currentCounter = 1;
                    privateUrlCounter[sourceAddress][requestUrl].totalCounter = 1;
                }
                urlCounterCache = {};
                urlCounterCache.sourceAddress = sourceAddress;
                urlCounterCache.worker = process.env.WORKER_ID;
                urlCounterCache.key = cacheKey;
                urlCounterCache.requestUrl = requestUrl;
                urlCounterCache.currentCounter = 1;
                urlCounterCache.totalCounter = 1;
            }
            metricsCache.set(cacheKey, urlCounterCache);
        });
        cleanupDiff = (Date.now() - lastCleanupMetricsDate) / 1000;
        if (cleanupDiff > config.get('server.logStatsInterval')) {
            cleanUp();
        }
    };

    //-----------------------------------------------------------------------
    //Function: logMetrics
    //
    //Description: Log the metrics
    //
    //Parameters: description - Description for the metrics
    //
    //Returns: None
    //-----------------------------------------------------------------------
    Metrics.logMetrics = function (description) {
        var currentDate = Date.now();
        var updateDateDiff = currentDate - lastLogUrlMetricsDate;
        lastLogUrlMetricsDate = Date.now();
        metricsCache.keys().then(function(metricsCacheKeysResults) {
            if(!metricsCacheKeysResults.err) {
                var totalUrlCurrentCounter = 0;
                var totalUrlCounter = 0;
                var sourceInfo = {};
                var urlApiInfo = {};
                var sourceAndUrlInfo = {};
                var sourceAndUrlInfoTable = new Table({
                    style: tableStyling,
                    head: ['Notify Source, URL', 'Messages', 'Messages In Interval', 'Messages Per Sec'], colWidths: [60, 15, 25, 20]
                });
                var sourceInfoTable = new Table({
                    style: tableStyling,
                    head: ['Notify Source', 'Messages', 'Messages In Interval', 'Messages Per Sec'], colWidths: [30, 15, 25, 20]
                });
                var urlInfoTable = new Table({
                    style: tableStyling,
                    head: ['URL', 'Messages', 'Messages In Interval', 'Messages Per Sec'], colWidths: [60, 15, 25, 20]
                });
                if (metricsCacheKeysResults.keys === undefined || metricsCacheKeysResults.keys.length <= 0) {
                    return;
                }
                var urlKeys = metricsCacheKeysResults.keys;
                async.eachLimit(urlKeys, config.get('server.asyncLimit'), function (urlKey, callback) {
                    metricsCache.get(urlKey).then(function(urlCacheResults) {
                        var urlSourceObj = urlCacheResults.value;
                        totalUrlCurrentCounter += urlSourceObj.currentCounter;
                        totalUrlCounter += urlSourceObj.totalCounter;
                        var messagesInterval = (urlSourceObj.currentCounter / updateDateDiff) * 1000;
                        if (sourceInfo[urlSourceObj.sourceAddress] === undefined) {
                            sourceInfo[urlSourceObj.sourceAddress] = {};
                            sourceInfo[urlSourceObj.sourceAddress].currentCounter = urlSourceObj.currentCounter;
                            sourceInfo[urlSourceObj.sourceAddress].totalCounter = urlSourceObj.totalCounter;
                        } else {
                            sourceInfo[urlSourceObj.sourceAddress].currentCounter = urlSourceObj.currentCounter + sourceInfo[urlSourceObj.sourceAddress].currentCounter;
                            sourceInfo[urlSourceObj.sourceAddress].totalCounter = urlSourceObj.currentCounter + sourceInfo[urlSourceObj.sourceAddress].totalCounter;
                        }
                        if (urlApiInfo[urlSourceObj.requestUrl] === undefined) {
                            urlApiInfo[urlSourceObj.requestUrl] = {};
                            urlApiInfo[urlSourceObj.requestUrl].currentCounter = urlSourceObj.currentCounter;
                            urlApiInfo[urlSourceObj.requestUrl].totalCounter = urlSourceObj.totalCounter;
                        } else {
                            urlApiInfo[urlSourceObj.requestUrl].currentCounter = urlSourceObj.currentCounter + urlApiInfo[urlSourceObj.requestUrl].currentCounter;
                            urlApiInfo[urlSourceObj.requestUrl].totalCounter = urlSourceObj.totalCounter + urlApiInfo[urlSourceObj.requestUrl].totalCounter;
                        }
                        var sourceAndUrlKey = urlSourceObj.sourceAddress + "," + urlSourceObj.requestUrl;
                        if (sourceAndUrlInfo[sourceAndUrlKey] === undefined) {
                            sourceAndUrlInfo[sourceAndUrlKey] = {};
                            sourceAndUrlInfo[sourceAndUrlKey].currentCounter = urlSourceObj.currentCounter;
                            sourceAndUrlInfo[sourceAndUrlKey].totalCounter = urlSourceObj.totalCounter;
                        } else {
                            sourceAndUrlInfo[sourceAndUrlKey].currentCounter = urlSourceObj.currentCounter + sourceAndUrlInfo[sourceAndUrlKey].currentCounter;
                            sourceAndUrlInfo[sourceAndUrlKey].totalCounter = urlSourceObj.currentCounter + sourceAndUrlInfo[sourceAndUrlKey].totalCounter;
                        }
                        urlSourceObj.currentCounter = 0;
                        metricsCache.set(urlKey, urlSourceObj);
                        callback();
                    });
                }, function(err) {
                    async.eachOf(sourceAndUrlInfo, function (sourceAndUrlValue, sourceAndUrlKey, callback) {
                        var messagesInterval = (sourceAndUrlValue.currentCounter / updateDateDiff) * 1000;
                        sourceAndUrlInfoTable.push([sourceAndUrlKey,  sourceAndUrlValue.totalCounter, sourceAndUrlValue.currentCounter, messagesInterval.toFixed(2)]);
                        callback();
                    }, function(err) {
                        logger.debug("Source and URL Stats for " + description + "\n" + sourceAndUrlInfoTable.toString());
                        async.eachOf(sourceInfo, function (sourceValue, sourceKey, callback) {
                            var messagesInterval = (sourceValue.currentCounter / updateDateDiff) * 1000;
                            sourceInfoTable.push([sourceKey, sourceValue.totalCounter, sourceValue.currentCounter, messagesInterval.toFixed(2)]);
                            callback();
                        }, function(err) {
                            logger.debug("Source URL Stats for " + description + "\n" + sourceInfoTable.toString());
                            async.eachOf(urlApiInfo, function (urlApiValue, urlApiKey, callback) {
                                var messagesInterval = (urlApiValue.currentCounter / updateDateDiff) * 1000;
                                urlInfoTable.push([urlApiKey, urlApiValue.totalCounter, urlApiValue.currentCounter, messagesInterval.toFixed(2)]);
                                callback();
                            }, function(err) {
                                logger.info("URL Stats for " + description + "\n" + urlInfoTable.toString());
                                var totalInfoTable = new Table({
                                    style: tableStyling
                                });
                                var messagesInterval = (totalUrlCurrentCounter / updateDateDiff) * 1000;
                                totalInfoTable.push(
                                        {'Messages': totalUrlCounter},
                                        {'Messages In Interval': totalUrlCurrentCounter},
                                        {'Messages Per Second': messagesInterval.toFixed(2)}
                                );
                                logger.info("Total Information Stats for " + description + "\n" + totalInfoTable.toString());
                            });
                        });
                    });
                });
            } else {
                logger.error("Errors while getting keys");
            }
        });
    };

    //-----------------------------------------------------------------------
    //Function: replyMetrics
    //
    //Description: HTTP reply with metrics data
    //
    //Parameters: response - HTTP response
    //
    //Returns: None
    //-----------------------------------------------------------------------
    Metrics.replyMetrics = function (response) {
        var currentDate = Date.now();
        var updateDateDiff = currentDate - lastLogUrlMetricsDate;
        metricsCache.keys().then(function(metricsCacheKeysResults) {
            if(!metricsCacheKeysResults.err) {
                if (metricsCacheKeysResults.keys === undefined || metricsCacheKeysResults.keys.length <= 0) {
                    return response.json({});
                }
                var urlKeys = metricsCacheKeysResults.keys;
                var totalUrlCurrentCounter = 0;
                var totalUrlCounter = 0;
                var workerInfo = [];
                var sourceInfo = {};
                var urlApiInfo = {};
                var messagesInterval = 0;
                async.eachLimit(urlKeys, config.get('server.asyncLimit'), function (urlKey, callback) {
                    metricsCache.get(urlKey).then(function(urlCacheResults) {
                        var urlSourceObj = urlCacheResults.value;
                        totalUrlCurrentCounter += urlSourceObj.currentCounter;
                        totalUrlCounter += urlSourceObj.totalCounter;
                        messagesInterval = (urlSourceObj.currentCounter / updateDateDiff) * 1000;
                        urlSourceObj.currentMessagesPerSecond = messagesInterval.toFixed(2);
                        workerInfo.push(urlSourceObj);
                        if (sourceInfo[urlSourceObj.sourceAddress] === undefined) {
                            sourceInfo[urlSourceObj.sourceAddress] = {};
                            sourceInfo[urlSourceObj.sourceAddress].currentCounter = urlSourceObj.currentCounter;
                            messagesInterval = (sourceInfo[urlSourceObj.sourceAddress].currentCounter / updateDateDiff) * 1000;
                            sourceInfo[urlSourceObj.sourceAddress].currentMessagesPerSecond = messagesInterval.toFixed(2);
                            sourceInfo[urlSourceObj.sourceAddress].totalCounter = urlSourceObj.totalCounter;
                        } else {
                            sourceInfo[urlSourceObj.sourceAddress].currentCounter = urlSourceObj.currentCounter + sourceInfo[urlSourceObj.sourceAddress].currentCounter;
                            messagesInterval = (sourceInfo[urlSourceObj.sourceAddress].currentCounter / updateDateDiff) * 1000;
                            sourceInfo[urlSourceObj.sourceAddress].currentMessagesPerSecond = messagesInterval.toFixed(2);
                            sourceInfo[urlSourceObj.sourceAddress].totalCounter = urlSourceObj.currentCounter + sourceInfo[urlSourceObj.sourceAddress].totalCounter;
                        }
                        if (urlApiInfo[urlSourceObj.requestUrl] === undefined) {
                            urlApiInfo[urlSourceObj.requestUrl] = {};
                            urlApiInfo[urlSourceObj.requestUrl].currentCounter = urlSourceObj.currentCounter;
                            messagesInterval = (urlApiInfo[urlSourceObj.requestUrl].currentCounter / updateDateDiff) * 1000;
                            urlApiInfo[urlSourceObj.requestUrl].currentMessagesPerSecond = messagesInterval.toFixed(2);
                            urlApiInfo[urlSourceObj.requestUrl].totalCounter = urlSourceObj.totalCounter;
                        } else {
                            urlApiInfo[urlSourceObj.requestUrl].currentCounter = urlSourceObj.currentCounter + urlApiInfo[urlSourceObj.requestUrl].currentCounter;
                            messagesInterval = (urlApiInfo[urlSourceObj.requestUrl].currentCounter / updateDateDiff) * 1000;
                            urlApiInfo[urlSourceObj.requestUrl].currentMessagesPerSecond = messagesInterval.toFixed(2);
                            urlApiInfo[urlSourceObj.requestUrl].totalCounter = urlSourceObj.totalCounter + urlApiInfo[urlSourceObj.requestUrl].totalCounter;
                        }
                        callback();
                    });
                }, function(err) {
                    var metricsObj = {};
                    metricsObj.workers = workerInfo;
                    metricsObj.source = sourceInfo;
                    metricsObj.url = urlApiInfo;
                    metricsObj.total = {};
                    messagesInterval = (totalUrlCurrentCounter / updateDateDiff) * 1000;
                    metricsObj.total.totalCounter = totalUrlCounter;
                    metricsObj.total.totalCurrentCounter = totalUrlCurrentCounter;
                    metricsObj.total.totalCurrentMessagesPerSecond = messagesInterval.toFixed(2);
                    logger.info("Worker [%s]: Metrics response", process.env.WORKER_ID);
                    return response.json(metricsObj);
                });
            } else {
                logger.error("Errors while getting keys");
            }
        });
    };

    return Metrics;
};