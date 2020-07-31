module.exports = function(RED) {
    function TimerctlIn(config) {
        RED.nodes.createNode(this, config);
        this.program = RED.nodes.getNode(config.program);
        if (!this.program) return;

        // Send state messages to our first output
        const onState = (state) => {
            this.send([{
                topic: config.stateCmd,
                payload: state,
                program: this.program.name,
            }, null]);
        };
        // Send tick messages to our second output
        const onTick = (tick) => {
            this.send([null, {
                topic: config.tickCmd,
                payload: tick,
                program: this.program.name,
            }]);
        };

        this.program.on('state', onState);
        this.program.on('tick', onTick);

        this.on('close', () => {
            // Remove our event listeners when the node is destroyed
            this.program.off('state', onState);
            this.program.off('tick', onTick);
        });
    }
    RED.nodes.registerType('timerctl in', TimerctlIn);
}
