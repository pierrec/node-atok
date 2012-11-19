function buffer_SubRule (buf, str) {
	// Common properties
	this.idx = -1
	this.length = 1
	this.next = lastSubRule
	this.prev = null
	// Specific properties
	this.buf = buf
	this.str = str
}

buffer_SubRule.prototype.test = function (buf, offset) {
	var isString = typeof buf === 'string'
	var n = isString ? this.str.length : this.buf.length

	if (buf.length < offset + n) return -1

	var i = buf.indexOf( isString ? this.str : this.buf, offset)

	if (this.length > 0) this.length = n

	return i < 0 ? -1 : this.next.test(buf, i + n)
}