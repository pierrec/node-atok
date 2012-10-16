function buffer_escapedSubRule (buf, str, esc) {
	// Common properties
	this.idx = -1
	this.length = 1
	this.next = lastSubRule
	// Specific properties
	this.buf = buf
	this.str = str
	this.esc = esc.charCodeAt(0)
}

buffer_escapedSubRule.prototype.test = function (buf, offset) {
	var isString = typeof buf === 'string'
	var n = isString ? this.str.length : this.buf.length

	if (buf.length < offset + n) return -1

	var i = -1
	var len = buf.length

	if (isString) {
		while (offset < len) {
			i = buf.indexOf(this.str, offset)
			if (i <= 0) break

			for (var esc_i = i, esc_num = 0; esc_i > 0 && buf.charCodeAt(--esc_i) === this.esc; esc_num++) {}

			if ( (esc_num % 2) === 0 ) return this.next.test(buf, i + n)
			offset = i + 1
		}
	} else {
		while (offset < len) {
			i = buf.indexOf(this.buf, offset)
			if (i <= 0) break

			for (var esc_i = i, esc_num = 0; esc_i > 0 && buf[--esc_i] === this.esc; esc_num++) {}

			if ( (esc_num % 2) === 0 ) return this.next.test(buf, i + n)
			offset = i + 1
		}
	}

	if (this.length > 0) this.length = n

	return i < 0 ? -1 : this.next.test(buf, n)
}