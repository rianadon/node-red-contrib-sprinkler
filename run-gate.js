module.exports = function(RED) {
    function RunGate(config) {
        RED.nodes.createNode(this, config);
        this.program = RED.nodes.getNode(config.program);

        const onState = (state) => {
            if (state == 'stopped') {
                this.status({ fill:'grey', shape:'ring', text: this.program.name });
            } else if (state == 'blocked') {
                this.status({ fill: 'red', shape: 'dot', text: 'Blocked' });
            } else {
                this.status({ fill: 'red', shape: 'dot', text: 'Closed' });
            }
        }

        if (this.program) {
            this.status({ fill:'grey', shape:'ring', text: this.program.name });
            this.program.on('state', onState);
        }
        this.on('input', (msg, send, done) => {
            if (!this.program) return done('Gate closed because no program specified');
            if (this.program.state == 'stopped') {
                msg.program = this.program.name;
                send(msg);
            }
            done();
        });
        this.on('close', () => {
            this.program.off('state', onState);
        });
    }
    RED.nodes.registerType('run-gate', RunGate);
}
