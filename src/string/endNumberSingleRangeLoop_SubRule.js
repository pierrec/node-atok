function endNumberSingleRangeLoop_SubRule (end) {
	this.size = 1
	this.idx = -1
	this.end = toCharCodes(end)
	this.token = false
	this.length = 1
}

endNumberSingleRangeLoop_SubRule.prototype.exec = function (s, start) {
	if (s.charCodeAt(start) > this.end) return -1

	var cEnd = this.end, c
	var pos = start + 1, n = s.length
	
	while (pos < n) {
		c = s.charCodeAt(pos)
		if (c > cEnd) break
		pos++
	}
	return pos - start
}

