function noop_SubRule () {
	// Common properties
	this.idx = -1
	this.length = 0
	this.next = lastSubRule
}

noop_SubRule.prototype.test = function (buf, offset) {
	return this.next.test(buf, offset)
}