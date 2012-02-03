module.exports = SubRule

var toCharCodes = require('./utils').toCharCodes

function SubRule (end) {
	this.size = 1
	this.idx = -1
	this.end = toCharCodes(end)
}

SubRule.prototype.exec = function (s, start) {
	var c = s.charCodeAt(start)
	return c <= this.end ? 1 : -1
}