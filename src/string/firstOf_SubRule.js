function firstOf_SubRule (list) {
	this.size = 0
	this.idx = -1
	this.n = list.length
	this.list = list
	this.token = false
}

firstOf_SubRule.prototype.exec = function (s, start) {
	var buf = s, offset = start
	var l = this.list
	var res = -1
	this.size = 0

	// Check all patterns
	for (var i, j = 0, n = this.n; j < n && res !== 0; j++) {
		i = buf.indexOf( l[j], offset ) // TODO indexOf
		if (i >= 0) {
			this.size = l[j].length
			this.idx = j
			res = i - offset
			// Reduce the scope of the pattern search
			buf = buf.substr(offset, res)
			offset = 0
		}
	}

	return res + this.size
}

