function startNumberSingleRange_SubRule (start) {
	this.size = 1
	this.idx = -1
	this.start = toCharCodes(start)
}

startNumberSingleRange_SubRule.prototype.exec = function (s, start) {
	var c = s.charCodeAt(start)
	return c >= this.start ? 1 : -1
}

