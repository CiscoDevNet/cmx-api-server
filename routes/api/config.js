var express = require('express');
var util = require('util');
var router = express.Router();
var logger = require(__base + 'config/logger');
var configOptions = require(__base + 'config/options');
var pkg = require(__base + 'package.json');

module.exports = function(passport) {

    //-----------------------------------------------------------------------
    //Get Listener: /api/v1/config/version
    //
    //Description: Will return the current version
    //-----------------------------------------------------------------------
    router.get('/version', passport.authenticate(passport.cmx_strategy, { session : false }), function(req, res, next) {
        var requestIp = req.ip;
        if (requestIp !== undefined) {
            requestIp = req.ip.replace(/^.*:/, '');
        }
        logger.info("Worker [%s]: Version request from: %s", process.env.WORKER_ID, requestIp);
        var versionObj = {};
        versionObj.version = pkg.version;
        logger.info("Worker [%s]: Version response from: %s with object: %s", process.env.WORKER_ID, requestIp, util.inspect(versionObj, {depth: null}));
        return res.json(versionObj);
    });

    return router;
};
