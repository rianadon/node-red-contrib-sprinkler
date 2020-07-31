module.exports = function(RED) {
    function ProgramNode(config) {
        RED.nodes.createNode(this, config);
        this.name = config.name;
        this.state = 'stopped';
        this.scale = 1; // time to scale how long the timer will wait
        this.resolution = 1000; // tick every second

        // Zone stuff (events from zone-timer and zone-out nodes)
        this.on('set-zone', (name, value) => {
            // Just broadcast 'em out
            this.emit('zone-set', name, value);
        });

        // Timer stuff

        // key = either 'state' or 'tick'
        const set = (key, val) => {
            this[key] = val;
            this.emit(key, val);
        }
        // Handle timer events that are sent from timerctl-in and zone-timer nodes
        this.on('start', (timeout) => {
            if (this.state != 'stopped') return;
            set('tick', Math.round(timeout * this.scale));
            resumeTimer();
        });
        this.on('resume', () => {
            if (this.state != 'paused') return;
            resumeTimer();
        });
        this.on('pause', () => {
            if (this.state != 'running') return;
            set('state', 'paused');
        });
        this.on('block', () => {
            if (this.state != 'stopped') return;
            set('state', 'blocked');
        });
        this.on('unblock', () => {
            if (this.state != 'blocked') return;
            set('state', 'stopped');
        });
        this.on('adjust', (ticks) => {
            set('tick', Math.max(ticks, 0));
            if (ticks <= 0) {
                clearTimeout(this.ticker);
                tick();
            }
        });
        this.on('scale', (newscale) => {
            // Update current ticks to use the new scaling
            set('tick', Math.round(this.tick / this.scale * newscale));
            this.scale = newscale;
        });

        // start the timer, whether it was stopped or paused
        const resumeTimer = () => {
            set('state', 'running'); // tell listeners the timer has started
            this.nextTime = Date.now() + this.resolution; // use date to compute next tick
            this.ticker = setTimeout(() => tick(), this.resolution);
        };
        // process a 1-second tick
        const tick = () => {
            if (this.state == 'paused') return;
            set('tick', Math.max(this.tick - 1, 0));
            this.nextTime += this.resolution;
            if (this.tick <= 0) {
                return set('state', 'stopped'); // broadcast stopped + return
            }
            this.ticker = setTimeout(() => tick(), this.nextTime - Date.now());
        };
    }

    RED.nodes.registerType('program', ProgramNode);
}
