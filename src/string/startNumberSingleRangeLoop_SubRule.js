function startNumberSingleRangeLoop_SubRule (start) {
	this.size = 1
	this.idx = -1
	this.start = toCharCodes(start)
	this.token = false
	this.length = 1
}

startNumberSingleRangeLoop_SubRule.prototype.exec = function (s, start) {
	if (s.charCodeAt(start) < this.start) return -1

	var cStart = this.start, c
	var pos = start + 1, n = s.length
	
	while (pos < n) {
		c = s.charCodeAt(pos)
		if (c < cStart) break
		pos++
	}
	return pos - start
}

