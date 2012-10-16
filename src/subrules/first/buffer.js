function buffer_firstSubRule (buf, str) {
	// Common properties
	this.idx = -1
	this.length = 1
	this.next = lastSubRule
	// Specific properties
	this.buf = buf
	this.str = str
}

buffer_firstSubRule.prototype.test = function (buf, offset) {
	var isString = typeof buf === 'string'
	var n = isString ? this.str.length : this.buf.length

	if (buf.length < offset + n) return -1

	if (isString) {
		for (var p = this.str, i = 0; i < n; i++) {
			if ( buf.charCodeAt(offset+i) !== p[i] ) return -1
		}
	} else {
		for (var p = this.buf, i = 0; i < n; i++) {
			if ( buf[offset+i] !== p[i] ) return -1
		}
	}
	if (this.length > 0) this.length = n

	return this.next.test(buf, offset + n)
}