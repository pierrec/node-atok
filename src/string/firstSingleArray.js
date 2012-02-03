module.exports = SubRule

var stringToCharCodes = require('./utils').stringToCharCodes

function SubRule (list) {
	this.size = 1
	this.idx = -1
	this.n = list.length
	this.list = stringToCharCodes(list)
}

SubRule.prototype.exec = function (s, start) {
	var c = s.charCodeAt(start)
	for (var i = 0, n = this.n, l = this.list; i < n; i++) {
		if ( c == l[i] ) return (this.idx = i, 1)
	}
	return -1
}