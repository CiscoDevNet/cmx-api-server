var express = require('express');
var config = require('config');
var router = express.Router();
var logger = require(__base + 'config/logger');
var Metrics = require(__base + 'lib/metrics');
var util = require('util');

module.exports = function(currentDeviceCache, notifySourceCache) {

    var urlMetrics = new Metrics(notifySourceCache);
    var associatedTtl = config.get('device.associatedTtl');
    var probingTtl = config.get('device.probingTtl');

    //-----------------------------------------------------------------------
    //Post Listener: /api/notify/v1/location
    //
    //Description: Listens for CMX location notifications
    //-----------------------------------------------------------------------
    router.post('/location', function(req, res, next) {
        var requestIp = req.ip;
        var bodyData = req.body;
        res.sendStatus(200).end();
        if (requestIp !== undefined) {
            requestIp = requestIp.replace(/^.*:/, '');
        } else {
            requestIp = 'Unknown';
        }
        if (logger.levels[logger.level] >= logger.levels['debug']) {
            logger.debug("Worker [%s]: Post location notification from: %s body: %s", process.env.WORKER_ID, requestIp, util.inspect(bodyData, {depth: null}));
        }
        var notificationData = bodyData.notifications[0];
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
            notificationData.macAddress = notificationData.deviceId;
            var deviceTtl = probingTtl;
            if (notificationData.associated !== undefined && notificationData.associated) {
                deviceTtl = associatedTtl;
            }
            currentDeviceCache.set("MAC:" + notificationData.deviceId, notificationData, deviceTtl);
            if (notificationData.ipAddress !== undefined && util.isArray(notificationData.ipAddress) && notificationData.ipAddress.length > 0) {
                if (notificationData.ipAddress[0] !== undefined) {
                    currentDeviceCache.set("IP:" + notificationData.ipAddress[0], notificationData.deviceId, deviceTtl);
                }
                if (notificationData.ipAddress[1] !== undefined) {
                    currentDeviceCache.set("IP:" + notificationData.ipAddress[1], notificationData.deviceId, deviceTtl);
                }
                if (notificationData.ipAddress[2] !== undefined) {
                    currentDeviceCache.set("IP:" + notificationData.ipAddress[2], notificationData.deviceId, deviceTtl);
                }
            }
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
        var bodyData = req.body;
        res.sendStatus(200).end();
        if (requestIp !== undefined) {
            requestIp = requestIp.replace(/^.*:/, '');
        } else {
            requestIp = 'Unknown';
        }
        if (logger.levels[logger.level] >= logger.levels['debug']) {
            logger.debug("Worker [%s]: Post absence notification from: %s body: %s", process.env.WORKER_ID, requestIp, util.inspect(bodyData, {depth: null}));
        }
        var notificationData = bodyData.notifications[0];
        res.sendStatus(200);
        try {
            logger.debug("Worker [%s]: Received absence notification for device from: %s for MAC: %s", process.env.WORKER_ID, requestIp, notificationData.deviceId);
            urlMetrics.incrementUrlCounter(requestIp, "/api/v1/notify/absence");
            currentDeviceCache.del("MAC:" + notificationData.deviceId);
            if (notificationData.ipAddress !== undefined && util.isArray(notificationData.ipAddress) && notificationData.ipAddress.length > 0) {
                if (notificationData.ipAddress[0] !== undefined) {
                    currentDeviceCache.del("IP:" + notificationData.ipAddress[0]);
                }
                if (notificationData.ipAddress[1] !== undefined) {
                    currentDeviceCache.del("IP:" + notificationData.ipAddress[1]);
                }
                if (notificationData.ipAddress[2] !== undefined) {
                    currentDeviceCache.del("IP:" + notificationData.ipAddress[2]);
                }
            }
            logger.debug("Worker [%s]: Completed proccessing the absence notification for device MAC: %s", process.env.WORKER_ID, notificationData.deviceId);
        } catch (err) {
            logger.error("Worker [%s]: Error processing absence notification: %s from source: %s for device: %s Body data: %s", process.env.WORKER_ID, err.message, requestIp, notificationData.deviceId, util.inspect(notificationData, {depth: null}));
        }
    });

    return router;
};