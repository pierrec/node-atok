function startendNumberSingleRangeLoop_SubRule (start, end) {
	this.size = 1
	this.idx = -1
	this.start = toCharCodes(start)
	this.end = toCharCodes(end)
	this.token = false
	this.length = 1
}

startendNumberSingleRangeLoop_SubRule.prototype.exec = function (s, start) {
	var c = s.charCodeAt(start)
	if (c < this.start || c > this.end) return -1

	var cStart = this.start, cEnd = this.end
	var pos = start + 1, n = s.length
	
	while (pos < n) {
		c = s.charCodeAt(pos)
		if (c < cStart || c > cEnd) break
		pos++
	}
	return pos - start
}

