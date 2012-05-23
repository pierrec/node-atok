function numberArray_SubRule (list) {
	this.size = 1
	this.idx = -1
	this.n = list.length
	// Max first... to enforce first rule always checked, which defeats this type of rule... TODO
	this.list = list.sort().reverse()
	this.token = true
	this.length = this.list[0]
}

numberArray_SubRule.prototype.exec = function (s, start) {
	for (var i = 0, n = this.n, l = this.list; i < n; i++) {
		if (s.length - start >= l[i]) return ( this.idx = i, s.substr(start, l[i]) )
	}
	return -1
}

