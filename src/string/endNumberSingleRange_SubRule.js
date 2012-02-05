function endNumberSingleRange_SubRule (end) {
	this.size = 1
	this.idx = -1
	this.end = toCharCodes(end)
}

endNumberSingleRange_SubRule.prototype.exec = function (s, start) {
	var c = s.charCodeAt(start)
	return c <= this.end ? 1 : -1
}

