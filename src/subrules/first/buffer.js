function buffer_firstSubRule (buf, str) {
	// Common properties
	this.size = 0
	this.idx = -1
	this.length = buf.length
	this.next = null
	// Specific properties
	this.buf = buf
	this.str = str
}

buffer_firstSubRule.prototype.test = function (buf, offset) {
	var isString = typeof buf === 'string'
	var n = isString ? this.str.length : this.buf.length

	if (buf.length < offset + n) return -1

	if (isString) {
		for (var p = this.buf, i = 0; i < n; i++) {
			if ( buf.charCodeAt(offset+i) !== p[i] ) return -1
		}
	} else {
		for (var p = this.buf, i = 0; i < n; i++) {
			if ( buf[offset+i] !== p[i] ) return -1
		}
	}
	return this.next.test(buf, offset + n)
}