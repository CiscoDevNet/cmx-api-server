var winston = require('winston');
var logger = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)({timestamp: true, level: 'info'})
//      new (winston.transports.File)({timestamp: true, maxsize: 104857600, maxFiles: 10, level: 'info', handleExceptions: true, json: false,  filename: "/opt/cmx/var/log/apiserver/server.log"})
    ]
});
module.exports = logger;