function buffer_loop_firstSubRule (buf, str) {
	// Common properties
	this.idx = -1
	this.length = 1
	this.next = lastSubRule
	// Specific properties
	this.buf = buf
	this.str = str
}

buffer_loop_firstSubRule.prototype.test = function (buf, offset) {
	var isString = typeof buf === 'string'
	var bufLen = buf.length
	var pos = offset

	if (bufLen < offset + n) return -1


	if (isString) {
		var p = this.str
		var n = p.length

		loop_String: while (pos < bufLen) {
			for (var i = 0; i < n; i++) {
				if ( buf.charCodeAt(pos+i) !== p[i] ) break loop_String
			}
			pos += n
		}
	} else {
		var p = this.buf
		var n = p.length

		loop_Buffer: while (pos < bufLen) {
			for (var i = 0; i < n; i++) {
				if ( buf[pos+i] !== p[i] ) break loop_Buffer
			}
			pos += n
		}
	}
	if (this.length > 0) this.length = n

	// At least one match if the offset changed
	return pos > offset ? this.next.test(buf, pos) : -1
}