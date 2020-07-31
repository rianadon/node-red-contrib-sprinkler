module.exports = function(RED) {
    const evalProp = RED.util.evaluateNodeProperty;

    function ZoneOut(config) {
        RED.nodes.createNode(this, config);
        this.program = RED.nodes.getNode(config.program);

        this.on('input', (msg) => {
            if (!this.program) return done('Cannot control zone because no program specified');
            const zoneName = evalProp(config.zonename, config.zonenametype, this, msg);
            const val = evalProp(config.val, config.valtype, this, msg);
            this.program.emit('set-zone', zoneName, val);
        });
    }
    RED.nodes.registerType('zone out', ZoneOut);
}
