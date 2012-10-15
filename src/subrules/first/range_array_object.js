function range_array_object_firstSubRule (start, end) {
	// Common properties
	this.idx = -1
	this.length = 1
	this.next = null
	// Specific properties
	this.start = start
	this.end = end
}

range_array_object_firstSubRule.prototype.test = function (buf, offset) {
	var isString = typeof buf === 'string'
	var start = this.start
	var end = this.end
	var n = start.length // Same length as this.end

	if (isString) {
		for (var i = 0; i < n; i++) {
			if (
				buf.charCodeAt(offset) >= start[i]
			&&	buf.charCodeAt(offset) <= end[i]
			)
				return this.next.test(buf, offset + 1)
		}
	} else {
		for (var i = 0; i < n; i++) {
			if (
				buf[offset] >= start[i]
			&&	buf[offset] <= end[i]
			)
				return this.next.test(buf, offset + 1)
		}
	}

	return -1
}