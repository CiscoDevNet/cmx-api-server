module.exports.NOTIFY_WEB_PORT = 9094;                 // Web server port to listen for notifications
module.exports.REST_WEB_PORT = 9095;                   // Web server port to listen for REST APIs
module.exports.DO_HTTPS = true;                        // Should the web server start using HTTPS

module.exports.NUMBER_NOTIFY_WORKERS = 5;              // Number of workers for the notification processing
module.exports.NUMBER_REST_WORKERS = 2;                // Number of workers for the REST API handling

module.exports.CURRENT_DEVICE_TTL = 1200;              // Number of seconds before removing device from current cache if not updated
module.exports.CURRENT_DEVICE_CHECK_PERIOD = 120;      // Number of seconds before checking for current devices to be removed

module.exports.NOTIFY_TTL = 1200;                      // Number of seconds before removing notify sources if not updated
module.exports.NOTIFY_CHECK_PERIOD = 120;              // Number of seconds before checking for notify sources to be removed

module.exports.REST_TTL = 1200;                        // Number of seconds before removing REST sources if not updated
module.exports.REST_CHECK_PERIOD = 120;                // Number of seconds before checking for REST sources to be removed

module.exports.ASYNC_LIMIT = 5000;                     // Maximum number of async operations at a time

module.exports.LOG_SUMMARY_INFO_STATS_INTERVAL = 1800; // Number of seconds between logging summary information stats

module.exports.DO_API_AUTHENTICATION = true;           // Should API authentication be done
module.exports.CMX_API_USERID = 'api';                 // API userid
module.exports.CMX_API_PASSWORD = 'api';               // API password