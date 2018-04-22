var express = require('express');
var router = express.Router();
var logger = require(__base + 'config/logger');
var Metrics = require(__base + 'lib/metrics');
var util = require('util');

module.exports = function(currentDeviceCache, notifySourceCache) {

    var urlMetrics = new Metrics(notifySourceCache);

    //-----------------------------------------------------------------------
    //Post Listener: /api/notify/v1/location
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
        logger.debug("Worker [%s]: Post location notification from: %s body: %s", process.env.WORKER_ID, requestIp, util.inspect(req.body, {depth: null}));
        var bodyData = req.body;
        var notificationData = bodyData.notifications[0];
        res.sendStatus(200);
        try {
            logger.debug("Worker [%s]: Received location notification for device from: %s for MAC: %s", process.env.WORKER_ID, requestIp, notificationData.deviceId);
            urlMetrics.incrementUrlCounter(requestIp, "/api/v1/notify/location");
            if (notificationData.entity !== "WIRELESS_CLIENTS") {
                logger.error("Worker [%s]: Location notification for device MAC: %s is not a wirelees client but a:%s. Ignoring notification.", process.env.WORKER_ID, notificationData.deviceId, notificationData.entity);
                return;
            }
            var currentDate = Date.now();
            notificationData.sourceNotification = requestIp;
            notificationData.sourceNotificationKey = requestIp + "," + process.env.WORKER_ID;
            notificationData.notificationTime = currentDate.toString();
            currentDeviceCache.set(notificationData.deviceId, notificationData);
            logger.debug("Worker [%s]: Completed proccessing the location notification for device MAC: %s", process.env.WORKER_ID, notificationData.deviceId);
        } catch (err) {
            logger.error("Worker [%s]: Error processing location notification: %s from source: %s for device: %s Body data: %s", process.env.WORKER_ID, err.message, requestIp, notificationData.deviceId, util.inspect(notificationData, {depth: null}));
        }
    });

    //-----------------------------------------------------------------------
    //Post Listener: /api/notify/v1/absence
    //
    //Description: Listens for CMX absence notifications
    //-----------------------------------------------------------------------
    router.post('/absence', function(req, res, next) {
        var requestIp = req.ip;
        if (requestIp !== undefined) {
            requestIp = req.ip.replace(/^.*:/, '');
        } else {
            requestIp = 'Unknown';
        }
        logger.debug("Worker [%s]: Post absence notification from: %s body: %s", process.env.WORKER_ID, requestIp, util.inspect(req.body, {depth: null}));
        var bodyData = req.body;
        var notificationData = bodyData.notifications[0];
        res.sendStatus(200);
        try {
            logger.debug("Worker [%s]: Received absence notification for device from: %s for MAC: %s", process.env.WORKER_ID, requestIp, notificationData.deviceId);
            urlMetrics.incrementUrlCounter(requestIp, "/api/v1/notify/absence");
            currentDeviceCache.del(notificationData.deviceId);
            logger.debug("Worker [%s]: Completed proccessing the absence notification for device MAC: %s", process.env.WORKER_ID, notificationData.deviceId);
        } catch (err) {
            logger.error("Worker [%s]: Error processing absence notification: %s from source: %s for device: %s Body data: %s", process.env.WORKER_ID, err.message, requestIp, notificationData.deviceId, util.inspect(notificationData, {depth: null}));
        }
    });

    return router;
};