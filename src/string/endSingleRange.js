module.exports = SubRule

var toCharCodes = require('./utils').toCharCodes

function SubRule (end) {
	this.size = 1
	this.idx = -1
	this.end = toCharCodes(end)
}

SubRule.prototype.exec = function (s, start) {
	var c = s.charCodeAt(start)
	var l = this.end
	for (var i = 0, n = l.length; i < n; i++)
		if (c <= l[i]) return 1
	return -1
}