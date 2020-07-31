// Shamelessly copied from https://github.com/mrgadget/node-red-contrib-eztimer/blob/develop/index.js
exports.getSeconds = function getSeconds(val) {
    var secs = 0;

    // accept 00:00, 00:00:00, 45s, 45h,4m etc.
    var matches = new RegExp(/(?:(\d+)[h:\s,]+)?(?:(\d+)[m:\s,]+)?(?:(\d+)[s\s]*)?$/).exec(val);
    if (matches.length > 1) {
        if (matches[1] != null) {
            secs += parseInt(matches[1]) * 3600; // hours
        }
        if (matches[2] != null) {
            secs += parseInt(matches[2]) * 60; // minutes
        }
        if (matches[3] != null) {
            secs += parseInt(matches[3]) * 1; // seconds
        }
    } else {
        return 0;
    }

    return secs;
}
