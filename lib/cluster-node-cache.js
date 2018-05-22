module.exports = function(cluster, options, namespace) {
  var UNDEFINED_KEY_ERROR = "Undefined or null key";

  var NodeCache     = require("node-cache");
  var Promise       = require('bluebird');
  var clsBluebird   = require('cls-bluebird');

  var crypto = require('crypto');
  var cache = {};

  function incoming_message(worker, msg) {
    switch(msg.method) {
      case "set":
        if(msg.namespace === undefined || msg.namespace === null || namespace === msg.namespace) {
            if(msg.key === undefined || msg.key === null) {
              worker.send({
                sig: msg.method + msg.key + msg.timestamp,
                body: {
                  err: UNDEFINED_KEY_ERROR,
                  success: {}
                }
              });
            } else {
              cache.set(msg.key, msg.val, msg.ttl, function(err, success) {
                worker.send({
                  sig: msg.method + msg.key + msg.timestamp,
                  body: {
                    err: err,
                    success: success
                  }
                });
              });
            }
        }
        break;
      case "get":
        if(msg.namespace === undefined || msg.namespace === null || namespace === msg.namespace) {
            if(msg.key === undefined || msg.key === null) {
              worker.send({
                sig: msg.method + msg.key + msg.timestamp,
                body: {
                  err: UNDEFINED_KEY_ERROR,
                  success: {}
                }
              });
            } else {
              cache.get(msg.key, function(err, value) {
                worker.send({
                  sig: msg.method + msg.key + msg.timestamp,
                  body: {
                    err: err,
                    value: value
                  }
                });
              });
            }
        }
        break;
        case "mget":
            if(msg.namespace === undefined || msg.namespace === null || namespace === msg.namespace) {
                if(msg.keys === undefined || msg.keys === null) {
                    worker.send({
                        sig: msg.method + msg.timestamp,
                        body: {
                            err: UNDEFINED_KEY_ERROR,
                            success: {}
                        }
                    });
                } else {
                    cache.mget(msg.keys, function(err, values) {
                        worker.send({
                            sig: msg.method + msg.timestamp,
                            body: {
                                err: err,
                                values: values
                            }
                        });
                    });
                }
            }
            break;
        case "getall":
            if(msg.namespace === undefined || msg.namespace === null || namespace === msg.namespace) {
              cache.keys(function(err, keys) {
                  if (!keys.err) {
                      cache.mget(keys, function(err, values) {
                          worker.send({
                              sig: msg.method + msg.timestamp,
                              body: {
                                  err: err,
                                  values: values
                              }
                          });
                      });
                  } else {
                      worker.send({
                          sig: msg.method + msg.timestamp,
                          body: {
                              err: err,
                              values: values
                          }
                      });
                  }
              });
            }
            break;
      case "del":
        if(msg.namespace === undefined || msg.namespace === null || namespace === msg.namespace) {
            cache.del(msg.key, function(err, count) {
              worker.send({
                sig: msg.method + msg.key + msg.timestamp,
                body: {
                  err: err,
                  count: count
                }
              });
            });
        }
        break;
      case "ttl":
        if(msg.namespace === undefined || msg.namespace === null || namespace === msg.namespace) {
            cache.ttl(msg.key, msg.ttl, function(err, changed) {
              worker.send({
                sig: msg.method + msg.key + msg.timestamp,
                body: {
                  err: err,
                  changed: changed
                }
              });
            });
        }
        break;
      case "keys":
        if(msg.namespace === undefined || msg.namespace === null || namespace === msg.namespace) {
            cache.keys(function(err, keys) {
              worker.send({
                sig: msg.method + msg.timestamp,
                body: {
                  err: err,
                  keys: keys
                }
              });
            });
        }
        break;
      case "getStats":
        if(msg.namespace === undefined || msg.namespace === null || namespace === msg.namespace) {
            worker.send({
              sig: msg.method + msg.timestamp,
              body: cache.getStats()
            });
        }
        break;
      case "flushAll":
        if(msg.namespace === undefined || msg.namespace === null || namespace === msg.namespace) {
            cache.flushAll();
            worker.send({
              sig: msg.method + msg.timestamp,
              body: cache.getStats()
            });
        }
        break;
    }
  }

  function getId() {
      return crypto.randomBytes(16).toString("hex");
    }

  if(cluster.isMaster && !process.env.DEBUG) {
    cache = new NodeCache(options);

    cluster.on('online', function(worker) {
      worker.on('message', incoming_message.bind(null, worker));
    });
  } else {
    var ClusterCache = {};
    var resolve_dict = {};
    var debugCache = {};

    var debugMode = Boolean(process.env.DEBUG);

    if(debugMode) {
      debugCache = new NodeCache(options);
    }

    process.on("message", function(msg) {
      if(resolve_dict[msg.sig]) {
        resolve_dict[msg.sig](msg.body);
        delete resolve_dict[msg.sig];
      }
    });

    ClusterCache.set = function(key, val, ttl) {
      return new Promise(function(resolve, reject) {
        if(debugMode) {
          if(key === undefined || key === null) {
            resolve({ err: "Undefined or null key", success: {} });
          } else {
            debugCache.set(key, val, ttl, function(err, success) {
              resolve({ err: err, success: success });
            });
          }
        } else {
          var timestamp = getId();
          resolve_dict["set" + key + timestamp] = resolve;
          process.send({
            method: "set",
            namespace: namespace,
            timestamp: timestamp,
            key: key,
            val: val,
            ttl: ttl
          });
        }
      });
    };

    ClusterCache.get = function(key) {
      return new Promise(function(resolve, reject) {
        if(debugMode) {
          if(key === undefined || key === null) {
            resolve({ err: UNDEFINED_KEY_ERROR, success: {} });
          } else {
            debugCache.get(key, function(err, value) {
              resolve({ err: err, value: value });
            });
          }
        } else {
          var timestamp = getId();
          resolve_dict["get" + key + timestamp] = resolve;
          process.send({
            method: "get",
            namespace: namespace,
            timestamp: timestamp,
            key: key,
          });
        }
      });
    };

      ClusterCache.mget = function(keys) {
          return new Promise(function(resolve, reject) {
              if(debugMode) {
                  if(keys === undefined || keys === null) {
                      resolve({ err: UNDEFINED_KEY_ERROR, success: {} });
                  } else {
                      debugCache.mget(keys, function(err, values) {
                          resolve({ err: err, values: values });
                      });
                  }
              } else {
                  var timestamp = getId();
                  resolve_dict["mget" + timestamp] = resolve;
                  process.send({
                      method: "mget",
                      namespace: namespace,
                      timestamp: timestamp,
                      keys: keys,
                  });
              }
          });
      };

      ClusterCache.getall = function() {
          return new Promise(function(resolve, reject) {
              if(debugMode) {
                resolve({ err: err, values: debugCache.data });
              } else {
                  var timestamp = getId();
                  resolve_dict["getall" + timestamp] = resolve;
                  process.send({
                      method: "getall",
                      namespace: namespace,
                      timestamp: timestamp
                  });
              }
          });
      };

    ClusterCache.del = function(key) {
      return new Promise(function(resolve, reject) {
        if(debugMode) {
          debugCache.del(key, function(err, count) {
            resolve({ err: err, count: count });
          });
        } else {
          var timestamp = getId();
          resolve_dict["del" + key + timestamp] = resolve;
          process.send({
            method: "del",
            namespace: namespace,
            timestamp: timestamp,
            key: key,
          });
        }
      });
    };

    ClusterCache.ttl = function(key, ttl) {
      return new Promise(function(resolve, reject) {
        if(debugMode) {
          debugCache.ttl(key, ttl, function(err, changed) {
            resolve({ err: err, changed: changed });
          });
        } else {
          var timestamp = getId();
          resolve_dict["ttl" + key + timestamp] = resolve;
          process.send({
            method: "ttl",
            namespace: namespace,
            timestamp: timestamp,
            key: key,
            ttl: ttl
          });
        }
      });
    };

    ClusterCache.keys = function() {
      return new Promise(function(resolve, reject) {
        if(debugMode) {
          debugCache.keys(function(err, keys) {
            resolve({ err: err, value: keys });
          });
        } else {
          var timestamp = getId();
          resolve_dict['keys' + timestamp] = resolve;
          process.send({
            method: "keys",
            namespace: namespace,
            timestamp: timestamp,
          });
        }
      });
    };

    ClusterCache.getStats = function() {
      return new Promise(function(resolve, reject) {
        if(debugMode) {
          resolve(debugCache.getStats());
        } else {
          var timestamp = getId();
          resolve_dict['getStats' + timestamp] = resolve;
          process.send({
            method: "getStats",
            namespace: namespace,
            timestamp: timestamp,
          });
        }
      });
    };

    ClusterCache.flushAll = function() {
      return new Promise(function(resolve, reject) {
        if(debugMode) {
          resolve(debugCache.flushAll());
        } else {
          var timestamp = getId();
          resolve_dict['flushAll' + timestamp] = resolve;
          process.send({
            method: "flushAll",
            namespace: namespace,
            timestamp: timestamp,
          });
        }
      });
    };

    return ClusterCache;
  }
};