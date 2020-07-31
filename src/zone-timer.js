const { getSeconds } = require('./util');

module.exports = function(RED) {
    const evalProp = RED.util.evaluateNodeProperty;

    function ZoneTimer(config) {
        RED.nodes.createNode(this, config);
        this.program = RED.nodes.getNode(config.program);

        if (this.program) {
            this.status({ fill:'grey', shape:'ring', text: this.program.name });
        }

        this.on('input', (msg, send, done) => {
            const dur = getSeconds(evalProp(config.duration, config.durationtype, this, msg));
            const zoneName = evalProp(config.zonename, config.zonenametype, this, msg);
            const onVal = evalProp(config.onval, config.onvaltype, this, msg);
            const offVal = evalProp(config.offval, config.offvaltype, this, msg);

            // Don't handle messages that are meant for a different program
            if (msg.program && msg.program != this.program.name) return done();

            if (dur <= 0) return done('Duration is either non-positive or of wrong format');
            if (!this.program) return done('Could not start timer because no program specified');
            if (this.program.state != 'stopped') return done("Cannot trigger a zone-timer while the timer is running or paused");
            const onState = (state) => {
                if (state == 'stopped') { // Clean up + send message when timer finishes
                    this.program.off('state', onState);
                    this.program.off('tick', onTick);
                    this.status({ fill:'grey', shape:'ring', text: this.program.name });
                    this.program.emit('set-zone', zoneName, offVal);
                    this.off('close', onClose);
                    if (!this.closing) {
                        send(this.queuedMessage);
                    }
                } else if (state == 'paused') { // Change status when timer pauses
                    this.status({ fill:'yellow', shape:'dot', text: 'Paused: ' + this.lastTick });
                    this.program.emit('set-zone', zoneName, offVal);
                } else if (state == 'running') { // Change status when timer starts/resumes
                    if (this.lastTick) this.status({ fill: 'blue', shape: 'dot', text: 'Running: ' + this.lastTick });
                    // Trigger the zone to be on. We'll handle this event as soon as the timer turns on,
                    // so the zone will turn on for the first time here!
                    this.program.emit('set-zone', zoneName, onVal);
                }
            }
            const onTick = (ticks) => {
                if (ticks < 1) return; // Avoids conflicts when a timer is both at 0s and stopped
                this.lastTick = ticks; // We need to know the time when the timer resumes
                this.status({ fill: 'blue', shape: 'dot', text: 'Running: ' + ticks });
            };
            const onClose = () => {
                // Clear timer if node gets prematurely destroyed
                this.program.off('tick', onTick);
                this.program.off('state', onState);
                this.program.emit('adjust', 0);
            };
            this.on('close', onClose);
            this.program.on('tick', onTick);
            this.program.on('state', onState);
            this.program.emit('start', dur); // Start the timer
            this.queuedMessage = msg; // Save the message to send it after the timer completes
            done();
        });
    }
    RED.nodes.registerType('zone-timer', ZoneTimer);
}
