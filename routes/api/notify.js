var express = require('express');
var router = express.Router();
var logger = require(__base + 'config/logger');
var configOptions = require(__base + 'config/options');
var Metrics = require(__base + 'lib/metrics');
var util = require('util');
var Table = require('cli-table');
var async = require('async');
var cluster = require('cluster');

module.exports = function(currentDeviceCache, notifySourceCache) {

    var urlMetrics = new Metrics(notifySourceCache);

    //-----------------------------------------------------------------------
    //Post Listener: /api/v1/notify/location
    //
    //Description: Listens for CMX location notifications
    //-----------------------------------------------------------------------
    router.post('/location', function(req, res, next) {
        var requestIp = req.ip;
        if (requestIp !== undefined) {
            requestIp = req.ip.replace(/^.*:/, '');
        } else {
            requestIp = 'Unknown';
        }
        logger.debug("Worker [%s]: Post notification from: %s body: %s", process.env.WORKER_ID, requestIp, util.inspect(req.body, {depth: null}));
        var bodyData = req.body;
        var notificationData = bodyData.notifications[0];
        res.sendStatus(200);
        try {
            logger.debug("Worker [%s]: Received notification for device from: %s for MAC: %s", process.env.WORKER_ID, requestIp, notificationData.deviceId);
            urlMetrics.incrementUrlCounter(requestIp, "/api/v1/notify/location");
            var currentDate = Date.now();
            notificationData.sourceNotification = requestIp;
            notificationData.sourceNotificationKey = requestIp + "," + process.env.WORKER_ID;
            notificationData.notificationTime = currentDate.toString();
            currentDeviceCache.set(notificationData.deviceId, notificationData);
            logger.debug("Worker [%s]: Completed proccessing the notification for device MAC: %s", process.env.WORKER_ID, notificationData.deviceId);
        } catch (err) {
            logger.error("Worker [%s]: Error processing notification: %s from source: %s for device: %s Body data: %s", process.env.WORKER_ID, err.message, requestIp, notificationData.deviceId, util.inspect(notificationData, {depth: null}));
        }
    });

    return router;
};