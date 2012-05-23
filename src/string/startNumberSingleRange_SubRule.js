function startNumberSingleRange_SubRule (start) {
	this.size = 1
	this.idx = -1
	this.start = toCharCodes(start)
	this.token = false
	this.length = 1
}

startNumberSingleRange_SubRule.prototype.exec = function (s, start) {
	return s.charCodeAt(start) >= this.start ? 1 : -1
}

