function rangeend_array_object_firstSubRule (end) {
	// Common properties
	this.idx = -1
	this.length = 1
	this.next = lastSubRule
	// Specific properties
	this.end = end
}

rangeend_array_object_firstSubRule.prototype.test = function (buf, offset) {
	var isString = typeof buf === 'string'
	var end = this.end
	var n = end.length

	if (isString) {
		for (var i = 0; i < n; i++) {
			if (
				buf.charCodeAt(offset) <= end[i]
			) {
				this.idx = i
				return this.next.test(buf, offset + 1)
			}
		}
	} else {
		for (var i = 0; i < n; i++) {
			if (
				buf[offset] >= end[i]
			) {
				this.idx = i
				return this.next.test(buf, offset + 1)
			}
		}
	}

	return -1
}