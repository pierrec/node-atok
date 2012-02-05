function startendNumberSingleRange_SubRule (start, end) {
	this.size = 1
	this.idx = -1
	this.start = toCharCodes(start)
	this.end = toCharCodes(end)
}

startendNumberSingleRange_SubRule.prototype.exec = function (s, start) {
	var c = s.charCodeAt(start)
	return c >= this.start && c <= this.end ? 1 : -1
}

