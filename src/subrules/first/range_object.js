function range_object_firstSubRule (start, end) {
	// Common properties
	this.idx = -1
	this.length = 1
	this.next = lastSubRule
	// Specific properties
	this.start = start
	this.end = end
}

range_object_firstSubRule.prototype.test = function (buf, offset) {
	var c = typeof buf === 'string' ? buf.charCodeAt(offset) : buf[offset]

	return c < this.start || c > this.end
		? -1
		: this.next.test(buf, offset + 1)
}