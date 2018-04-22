// load all the things we need
var config = require('config');
var logger = require(__base + 'config/logger');
var BasicStrategy = require('passport-http').BasicStrategy;
var AnonymousStrategy = require('passport-anonymous');
var Security = require(__base + 'lib/security');

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
            delete require.cache[require.resolve('config')];
            var config = require('config');
            if (config.get('authentication.doApiAuthentication')) {
                var hashPassword = security.getHashString(password, config.get('authentication.apiAuthenticationSalt'));
                var users = config.get('users');
                for (var i = 0, len = users.length; i < len; i++) {
                    if (username === users[i].userId && hashPassword === users[i].password) {
                        return done(null, USER_OBJ);
                    }
                }
                logger.warn('AUTHENTICATION: Invalid username or password entered for API');
                return done(null, false, {message: 'Incorrect username or password for API.'});
            }
            return done(null, USER_OBJ);
        }
    ));
};
