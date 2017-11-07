// load all the things we need
var logger = require(__base + 'config/logger');
var BasicStrategy = require('passport-http').BasicStrategy;
var AnonymousStrategy = require('passport-anonymous');
var configOptions = require(__base + 'config/options');
var Security = require(__base + 'lib/security');
var util = require('util');

// expose this function to our app using module.exports
module.exports = function(passport) {
    var USER_OBJ = {displayName: 'API User', name: 'api', id: 'api', role: 'api'};
    var security = new Security();

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, 'api');
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        return done(null, USER_OBJ);
    });

    passport.use('api-anonymous', new AnonymousStrategy());

    passport.use('api-login', new BasicStrategy(
        function(username, password, done) {
            if (configOptions.DO_API_AUTHENTICATION) {
                var hashPassword = security.getHashString(password, configOptions.CMX_API_SALT);
                if (username !== configOptions.CMX_API_USERID || hashPassword !== configOptions.CMX_API_PASSWORD) {
                    logger.warn('AUTHENTICATION: Invalid username or password entered for API');
                    return done(null, false, { message: 'Incorrect username or password for API.' });
                }                
            }
            return done(null, USER_OBJ);
        }
    ));
};
