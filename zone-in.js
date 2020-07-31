module.exports = function(RED) {
    function ZoneIn(config) {
        RED.nodes.createNode(this, config);
        this.program = RED.nodes.getNode(config.program);
        if (!this.program) return;
        this.program.on('zone-set', (topic, payload) => {
            if (config.zonename && topic != config.zonename) {
                return; // Filter out the zone
            }
            this.send({ topic, payload });
        });
        // Yup that's all
    }
    RED.nodes.registerType('zone in', ZoneIn);
}
