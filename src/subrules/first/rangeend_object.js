function rangeend_object_firstSubRule (end) {
	// Common properties
	this.idx = -1
	this.length = 1
	this.next = lastSubRule
	// Specific properties
	this.end = end
}

rangeend_object_firstSubRule.prototype.test = function (buf, offset) {
	var isString = typeof buf === 'string'

	if (isString) {
		if (
			buf.charCodeAt(offset) > this.end
		)
			return -1
	} else {
		if (
			buf[offset] > this.end
		)
			return -1
	}

	return this.next.test(buf, offset + 1)
}