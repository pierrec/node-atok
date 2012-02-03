module.exports = SubRule

function SubRule (list) {
	this.size = 1
	this.idx = -1
	this.n = list.length
	this.list = list
}

SubRule.prototype.exec = function (s, start) {
	for (var i = 0, n = this.n, l = this.list; i < n; i++) {
		if (s.length - start >= l[i]) return ( this.idx = i, s.substr(start, l[i]) )
	}
	return -1
}