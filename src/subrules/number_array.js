function number_arraySubRule (list) {
	// Common properties
	this.idx = -1
	this.length = 1
	this.next = lastSubRule
	this.prev = null
	// Specific properties
	// Filter out zero values
	this.list = list.filter(function (v) { return v !== 0 })
	this.hasZero = (list.length > this.list.length)
}

number_arraySubRule.prototype.test = function (buf, offset) {
	var list = this.list
	var delta = buf.length - offset

	if (delta === 0) return this.hasZero ? this.next.test(buf, offset) : -1

	for (var i = 0, len = list.length; i < len; i++) {
		if ( list[i] <= delta ) {
			if (this.length > 0) this.length = list[i]
			this.idx = i

			return this.next.test(buf, offset + list[i])
		}
	}

	return -1
}