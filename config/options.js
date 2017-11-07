module.exports.NOTIFY_WEB_PORT = 9094;                 // Web server port to listen for notifications
module.exports.REST_WEB_PORT = 9095;                   // Web server port to listen for REST APIs
module.exports.DO_HTTPS = true;                        // Should the web server start using HTTPS

module.exports.NUMBER_NOTIFY_WORKERS = 5;              // Number of workers for the notification processing
module.exports.NUMBER_REST_WORKERS = 2;                // Number of workers for the REST API handling

module.exports.CURRENT_DEVICE_TTL = 172800;            // Number of seconds before removing device from current cache if not updated
module.exports.CURRENT_DEVICE_CHECK_PERIOD = 600;      // Number of seconds before checking for current devices to be removed

module.exports.NOTIFY_TTL = 1200;                      // Number of seconds before removing notify sources if not updated
module.exports.NOTIFY_CHECK_PERIOD = 120;              // Number of seconds before checking for notify sources to be removed

module.exports.REST_TTL = 1200;                        // Number of seconds before removing REST sources if not updated
module.exports.REST_CHECK_PERIOD = 120;                // Number of seconds before checking for REST sources to be removed

module.exports.ASYNC_LIMIT = 5000;                     // Maximum number of async operations at a time

module.exports.LOG_SUMMARY_INFO_STATS_INTERVAL = 1800; // Number of seconds between logging summary information stats

module.exports.DO_API_AUTHENTICATION = true;           // Should API authentication be done
module.exports.IS_DEFAULT_PASSWORD = true;             // Is the default password still being used
module.exports.CMX_API_SALT = 'a8302c3f35edb347';      // API salt
module.exports.CMX_API_USERID = 'api';                 // API userid
module.exports.CMX_API_PASSWORD = '1f2721323fa143b88434f60773bc68c43fc7968285454ddea0ea3ca918a71dc101e9aa29fbe612d300e9bfdb92a69506ecb502bba0c4c4d37ee7cfe8171b12fb';               // API password