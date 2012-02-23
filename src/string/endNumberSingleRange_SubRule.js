function endNumberSingleRange_SubRule (end) {
	this.size = 1
	this.idx = -1
	this.end = toCharCodes(end)
	this.token = false
}

endNumberSingleRange_SubRule.prototype.exec = function (s, start) {
	return s.charCodeAt(start) <= this.end ? 1 : -1
}

