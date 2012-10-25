function rangestart_array_object_firstSubRule (start) {
	// Common properties
	this.idx = -1
	this.length = 1
	this.next = lastSubRule
	// Specific properties
	this.start = start
}

rangestart_array_object_firstSubRule.prototype.test = function (buf, offset) {
	var isString = typeof buf === 'string'
	var start = this.start
	var n = start.length

	if (isString) {
		for (var i = 0; i < n; i++) {
			if (
				buf.charCodeAt(offset) >= start[i]
			) {
				this.idx = i
				return this.next.test(buf, offset + 1)
			}
		}
	} else {
		for (var i = 0; i < n; i++) {
			if (
				buf[offset] >= start[i]
			) {
				this.idx = i
				return this.next.test(buf, offset + 1)
			}
		}
	}

	return -1
}