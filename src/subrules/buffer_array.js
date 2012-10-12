function buffer_arraySubRule (buf, str) {
	// Common properties
	this.idx = -1
	this.length = 1
	this.next = null
	// Specific properties
	this.buf = buf
	this.str = str
}

buffer_arraySubRule.prototype.test = function (buf, offset) {
	var isString = typeof buf === 'string'
	var list = isString ? this.str : this.buf

	for (var j = 0, len = list.length; j < len; j++) {
		var p = list[j]
		var n = p.length

		if (buf.length < offset + n) continue

		var i = buf.indexOf(p, offset)

		if (i >= 0) {
			if (this.length > 0) this.length = n
			this.idx = j

			return this.next.test(buf, i + n)
		}
	}

	return -1
}