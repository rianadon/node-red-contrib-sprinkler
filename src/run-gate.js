module.exports = function(RED) {
    function RunGate(config) {
        RED.nodes.createNode(this, config);
        this.program = RED.nodes.getNode(config.program);

        // Set the node status whenever timer state changes
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

            // Don't handle messages that are meant for a different program
            if (msg.program && msg.program != this.program.name) return done();

            // Pass the message through if the program is stopped (not started, not paused,
            // and not blocked). Otheriwse, don't send the message.
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
