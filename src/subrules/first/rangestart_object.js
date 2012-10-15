function rangestart_object_firstSubRule (start) {
	// Common properties
	this.idx = -1
	this.length = 1
	this.next = null
	// Specific properties
	this.start = start
}

rangestart_object_firstSubRule.prototype.test = function (buf, offset) {
	var isString = typeof buf === 'string'

	if (isString) {
		if (
			buf.charCodeAt(offset) < this.start
		)
			return -1
	} else {
		if (
			buf[offset] < this.start
		)
			return -1
	}

	return this.next.test(buf, offset + 1)
}