var express = require('express');
var util = require('util');
var router = express.Router();
var logger = require(__base + 'config/logger');
var Security = require(__base + 'lib/security');
var pkg = require(__base + 'package.json');

module.exports = function(passport) {

    //-----------------------------------------------------------------------
    //Get Listener: /api/config/v1/version
    //
    //Description: Will return the current version
    //-----------------------------------------------------------------------
    router.get('/version', passport.authenticate('api-anonymous', { session : false }), function(req, res, next) {
        var requestIp = req.ip;
        if (requestIp !== undefined) {
            requestIp = req.ip.replace(/^.*:/, '');
        }
        logger.debug("Worker [%s]: Version request from: %s", process.env.WORKER_ID, requestIp);
        var versionObj = {};
        versionObj.version = pkg.version;
        logger.debug("Worker [%s]: Version response from: %s with object: %s", process.env.WORKER_ID, requestIp, util.inspect(versionObj, {depth: null}));
        return res.json(versionObj);
    });

    //-----------------------------------------------------------------------
    //Get Listener: /api/config/v1/hash
    //
    //Description: Will return the hash password based upon the password and salt
    //-----------------------------------------------------------------------
    router.get('/hash', passport.authenticate('api-anonymous', { session : false }), function(req, res, next) {
        var security = new Security();
        var requestIp = req.ip;
        if (requestIp !== undefined) {
            requestIp = req.ip.replace(/^.*:/, '');
        }
        logger.info("Worker [%s]: Hash request from: %s", process.env.WORKER_ID, requestIp);
        if ( req.query['password'] === undefined) {
            var jsonData = {};
            jsonData.success = false;
            jsonData.error = {};
            jsonData.error.message = "Missing password option";
            return res.status(400).json(jsonData);
        }
        if ( req.query['salt'] === undefined) {
            var jsonData = {};
            jsonData.success = false;
            jsonData.error = {};
            jsonData.error.message = "Missing salt option";
            return res.status(400).json(jsonData);
        }
        var hashObj = {};
        hashObj.salt = req.query['salt'];
        hashObj.password = req.query['password'];
        hashObj.hash = security.getHashString(req.query['password'], req.query['salt']);
        logger.info("Worker [%s]: Hash response from: %s with hashed value", process.env.WORKER_ID, requestIp);
        return res.json(hashObj);
    });

    return router;
};
