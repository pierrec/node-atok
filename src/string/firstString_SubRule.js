function firstString_SubRule (s) {
	this.size = s.length
	this.idx = -1
	this.n = s.length
	this.str = s
	this.token = false
}

firstString_SubRule.prototype.exec = function (s, start) {
	if (s.length < this.n) return -1
	for (var p = this.str, i = 0, n = this.n; i < n; i++) {
		if (s[i+start] !== p[i]) return -1
	}
	return n
}

