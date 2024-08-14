const fs = require("fs");

exports.getBlockHeight = function () {
    let data = fs.readFileSync('blockHeight.json', 'utf8');
    return parseInt(data);
}
exports.writeBlockHeight = function (data) {
    fs.writeFileSync('blockHeight.json', data.toString());
}

