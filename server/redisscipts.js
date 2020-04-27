exports.redisscipts = function () {

    const redis = require("redis");
    const RedisServer = require('redis-server');

    module.startServer = function () {

        const REDIS_PORT = process.env.REDIS_PORT || 6379;
        // Simply pass the port that you want a Redis server to listen on.
        const server = new RedisServer(REDIS_PORT);

        server.open((err) => {
            if (err === null) {
                console.log("----------------Redis----------------------");
                console.log("[Redis] Redis server started");
            }
        });

        // server.close().then(() => {
        //     // The associated Redis server is now closed.
        //     console.log("[REdis] Redis server closed");
        // });
    };

    module.startclient = function () {

        const client = redis.createClient();

        client.on("error", function (error) {
            console.error(error);
        });

        client.set("key", "value", redis.print);
        client.get("key", redis.print);

        return client;
    };

    return module;
};

