var crypto = require('crypto');
var configOptions = require(__base + 'config/options');
var logger = require(__base + 'config/logger');

module.exports = function() {

    var Security = {};
    var SALT_LENGTH = 16;

    //-----------------------------------------------------------------------
    //Function: getHashString
    //
    //Description: Get the hash string
    //
    //Parameters: password - Password string to be hashed
    //            salt     - Salt for the hash
    //
    //Returns: Hash string
    //-----------------------------------------------------------------------
    Security.generateSalt = function(){
        return crypto.randomBytes(Math.ceil(SALT_LENGTH/2)).toString('hex').slice(0,SALT_LENGTH);
    };

    //-----------------------------------------------------------------------
    //Function: getHashString
    //
    //Description: Get the hash string
    //
    //Parameters: password - Password string to be hashed
    //            salt     - Salt for the hash
    //
    //Returns: Hash string
    //-----------------------------------------------------------------------
    Security.getHashString = function(password, salt) {
        return crypto.createHmac('sha512', salt).update(password).digest('hex');
    };

    return Security;
};