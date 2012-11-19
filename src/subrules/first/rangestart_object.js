function rangestart_object_firstSubRule (start) {
	// Common properties
	this.idx = -1
	this.length = 1
	this.next = lastSubRule
	// Specific properties
	this.start = start
}

rangestart_object_firstSubRule.prototype.test = function (buf, offset) {
	var c = typeof buf === 'string' ? buf.charCodeAt(offset) : buf[offset]

	return c < this.start
		? -1
		: this.next.test(buf, offset + 1)
}