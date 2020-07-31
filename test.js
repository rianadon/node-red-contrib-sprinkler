const helper = require('node-red-node-test-helper');
const ZoneTimer = require('./zone-timer.js');
const Program = require('./program.js');

// const zoneDefaults = { type: 'zone-timer', zonenametype: 'str', durationtype: 'str', program: 'program', onval: 'true', onvaltype: 'bool', offval: 'false', offvaltype: 'bool' };
// const landNode = { id: 'land', zonename: 'Land', duration: '3s', wires: [['grass']], ...zoneDefaults};
// const grassNode = { id: 'grass', zonename: 'Grass', duration: '4s', wires: [['trees']], ...zoneDefaults};
// const treesNode = { id: 'trees', zonename: 'trees', duration: '5s', ...zoneDefaults};
const zone1 = { id: 'n1', type: 'zone-timer', duration: '1s', durationtype: 'str', program: 'progm', wires: [['n2']] };
const zone2 = { ...zone1, id: 'n2', duration: '4s', wires: [['n3']] };
const program = { id: 'progm', type: 'program', name: 'Program A' };

describe('linear execution', function () {

    beforeEach(function (done) {
        helper.startServer(done);
    });

    afterEach(function (done) {
        helper.unload();
        helper.stopServer(done);
    });

    it('should be loaded', function (done) {
        var flow = [{ id: 'n1', type: 'zone-timer', name: 'timer' }];
        helper.load(ZoneTimer, flow, function () {
            var n1 = helper.getNode('n1');
            n1.should.have.property('name', 'timer');
            done();
        });
    });

    it('waits for 1 second', function (done) {
        const flow = [zone1, { id: 'n2', type: 'helper' }, program];
        helper.load([ZoneTimer, Program], flow, function () {
            const zone = helper.getNode('n1');
            const help = helper.getNode('n2');
            const start = Date.now();
            help.on('input', function (msg) {
                if (Date.now() - start > 900 && Date.now() - start < 1100) {
                    done();
                } else {
                    done(new Error('Timer did not wait right time: ' + (Date.now() - start)));
                }
            });
            zone.receive({ payload: 'test' });
        });
    });

    it('waits with multiple nodes', function (done) {
        const flow = [zone1, zone2, { id: 'n3', type: 'helper' }, program];
        helper.load([ZoneTimer, Program], flow, function () {
            helper.getNode('progm').resolution = 100; // Scale down timing by factor of 10
            const start = Date.now();
            helper.getNode('n3').on('input', function (msg) {
                if (Date.now() - start > 500 && Date.now() - start < 700) {
                    done();
                } else {
                    done(new Error('Timer did not wait right time: ' + (Date.now() - start)));
                }
            });
            helper.getNode('n1').receive({ payload: 'test' });
        });
    });
});
