function stringArray_SubRule (list) {
	this.size = list.length
	this.idx = -1
	this.n = list.length
	this.list = list
}

stringArray_SubRule.prototype.exec = function (s, start) {
	for (var i = 0, j, n = this.n, l = this.list; i < n; i++) {
		j = s.indexOf(l[i], start) - start // TODO indexOf
		if (j >= 0) return ( this.idx = i, j + (this.size = l[i].length) )
	}
	return -1
}

