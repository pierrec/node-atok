module.exports = SubRule

function SubRule (c) {
	// Common properties
	this.size = 1
	this.idx = -1
	// Specific properties
	this.c = c.charCodeAt(0)
}

SubRule.prototype.exec = function (s, start) {
	return s.charCodeAt(start) == this.c ? 1 : -1
}