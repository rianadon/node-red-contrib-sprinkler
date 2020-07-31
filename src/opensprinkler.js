const crypto = require('crypto');
const http = require('http');
const url = require('url');
const { getSeconds } = require('./util');

module.exports = function(RED) {
    const evalProp = RED.util.evaluateNodeProperty;

    function OpenSprinkler(config) {
        RED.nodes.createNode(this, config);
        const lowermap = config.map ? config.map.map(m => m.toLowerCase()) : null;
        const plainpassword = this.credentials.password;
        const password = plainpassword ? md5(plainpassword) : null;
        let host = config.host;
        if (!host.startsWith('http://')) host = 'http://' + host;
        const sprinklerurl = url.parse(host);
        const agent = new http.Agent({ keepAlive: true });

        const mapPayload = (payload) => {
            if (config.usemap) {
                const zone = lowermap.indexOf(payload.toLowerCase());
                if (zone < 0) {
                    throw new Error("Zone " + payload + " did not match any mapping");
                }
                return zone;
            } else {
                const zone = Number(payload);
                if (isNaN(zone)) {
                    throw new Error("Zone " + payload + " is expected to be a number");
                }
                return zone;
            }
        };

        const sendRequest = (path, done, callback) => {
            http.get({
                hostname: sprinklerurl.hostname,
                port: sprinklerurl.port,
                path,
                agent
            }, (res) => {
                let data = '';
                res.on('data', d => data += d);
                res.on('end', () => {
                    if (res.statusCode != 200) {
                        return done(new Error('Respondent with status code ' + res.statusCode + ': ' + data));
                    }
                    try {
                        const resObj = JSON.parse(data);
                        if (callback) callback(resObj);
                        done();
                    } catch(e) {
                        done(e);
                    }
                });
            }).on('error', done);
        };

        this.on('input', (msg, send, done) => {
            let maxduration = getSeconds(evalProp(config.maxduration, config.maxdurationtype, this, msg));
            if (maxduration <= 0) return done('Max on time is either non-positive or of wrong format');
            maxduration = Math.min(maxduration, 64800);
            try {
                const zone = mapPayload(msg.topic);
                sendRequest(
                    zoneRequest(zone, msg.payload, maxduration, password),
                    done, send, (res) =>
                {
                    send({ topic: msg.topic, payload: res });
                });
            } catch (err) {
                done(err);
            }
        });
        this.on('close', () => {
            // Turn off all zones when Node-RED restarts the flow
            sendRequest(offRequest(password), (err) => console.log(err), (dat) => console.log(dat));
        });
    }
    RED.nodes.registerType('opensprinkler', OpenSprinkler, {
        credentials: {
            password: {type:"password"}
        }
    });
}

/** Returns the URL to turn a zone on or off. */
function zoneRequest(zone, enable, time, password) {
    let url = "/cm?pw="+password+"&sid=" + zone;
    if (enable) {
        url += "&en=1&t="+time;
    } else {
        url += "&en=0";
    }
    return url;
}

/** Returns the URL to turn all zones off. */
function offRequest(password) {
    return "/cv?pw="+password+"&rsn=1";
}


function md5(password) {
    return crypto.createHash('md5').update(password).digest("hex");
}
