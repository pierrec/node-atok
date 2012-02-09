function firstChar_SubRule (c) {
	// Common properties
	this.size = 1
	this.idx = -1
	// Specific properties
	this.c = c.charCodeAt(0)
	this.token = false
}

firstChar_SubRule.prototype.exec = function (s, start) {
	return s.charCodeAt(start) == this.c ? 1 : -1
}

