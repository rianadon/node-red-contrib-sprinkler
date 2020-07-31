const { getSeconds } = require('./util');

module.exports = function(RED) {
    const evalProp = RED.util.evaluateNodeProperty;

    function TimerctlOut(config) {
        RED.nodes.createNode(this, config);
        this.program = RED.nodes.getNode(config.program);

        this.on('input', (msg, send, done) => {
            if (!this.program) return done('Cannot control timer because no program specified');

            let seconds = getSeconds(msg.payload);
            if (seconds <= 0) seconds = 60;

            if (msg.topic == config.pauseCmd) {
                this.program.emit('pause');
                if (!config.noblock) this.program.emit('block');
            } else if (msg.topic == config.resumeCmd) {
                this.program.emit('resume');
                // Always unblock even if the config isn't set
                this.program.emit('unblock');
            } else if (msg.topic == config.incrementCmd) {
                this.program.emit('adjust', this.program.tick + seconds);
            } else if (msg.topic == config.decrementCmd) {
                this.program.emit('adjust', this.program.tick - seconds);
            } else if (msg.topic == config.skipCmd) {
                this.program.emit('adjust', 0);
            } else if (msg.topic == config.adjustCmd) {
                this.program.emit('adjust', seconds);
            }
            done();
        });
    }
    RED.nodes.registerType('timerctl out', TimerctlOut);
}
