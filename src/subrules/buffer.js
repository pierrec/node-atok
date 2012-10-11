function buffer_SubRule (buf, str) {
	// Common properties
	this.size = 0
	this.idx = -1
	this.length = buf.length
	this.next = null
	// Specific properties
	this.buf = buf
	this.str = str
}

buffer_SubRule.prototype.test = function (buf, offset) {
	var isString = typeof buf === 'string'
	var n = isString ? this.str.length : this.buf.length

	if (buf.length < offset + n) return -1

	var i = buf.indexOf( isString ? this.str : this.buf, offset)

	return i < 0 ? -1 : this.next.test(buf, i + n)
}