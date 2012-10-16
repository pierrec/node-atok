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
	var isString = typeof buf === 'string'

	if (isString) {
		if (
			buf.charCodeAt(offset) < this.start
		||	buf.charCodeAt(offset) > this.end
		)
			return -1
	} else {
		if (
			buf[offset] < this.start
		||	buf[offset] > this.end
		)
			return -1
	}

	return this.next.test(buf, offset + 1)
}