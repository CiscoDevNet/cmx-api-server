var express = require('express');
var util = require('util');
var router = express.Router();
var logger = require(__base + 'config/logger');
var configOptions = require(__base + 'config/options');
var pkg = require(__base + 'package.json');

module.exports = function(passport, restMetrics, notifyMetrics) {

    //-----------------------------------------------------------------------
    //Get Listener: /api/metrics/v1/notifications
    //
    //Description: Will return the metrics for notifications
    //-----------------------------------------------------------------------
    router.get('/notifications', passport.authenticate(passport.cmx_strategy, { session : false }), function(req, res, next) {
        var requestIp = req.ip;
        if (requestIp !== undefined) {
            requestIp = req.ip.replace(/^.*:/, '');
        }
        logger.info("Worker [%s]: Metrics notifications request from: %s", process.env.WORKER_ID, requestIp);
        return notifyMetrics.replyMetrics(res);
    });

    //-----------------------------------------------------------------------
    //Get Listener: /api/metrics/v1/apis
    //
    //Description: Will return the metrics for APIs
    //-----------------------------------------------------------------------
    router.get('/apis', passport.authenticate(passport.cmx_strategy, { session : false }), function(req, res, next) {
        var requestIp = req.ip;
        if (requestIp !== undefined) {
            requestIp = req.ip.replace(/^.*:/, '');
        }
        logger.info("Worker [%s]: Metrics API request from: %s", process.env.WORKER_ID, requestIp);
        return restMetrics.replyMetrics(res);
    });

    return router;
};
