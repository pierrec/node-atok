function number_arraySubRule (list) {
	// Common properties
	this.idx = -1
	this.length = 1
	this.next = null
	// Specific properties
	this.list = list
}

number_arraySubRule.prototype.test = function (buf, offset) {
	var list = this.list

	for (var i = 0, n = list.length; i < n; i++) {
		if (offset + list[i] <= buf.length) {
			if (this.length > 0) this.length = list[i]
			this.idx = i

			return this.next.test(buf, offset + list[i])
		}
	}

	return -1
}