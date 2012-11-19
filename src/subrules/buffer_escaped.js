function buffer_escapedSubRule (buf, str, esc) {
	// Common properties
	this.idx = -1
	this.length = 1
	this.next = lastSubRule
	this.prev = null
	// Specific properties
	this.buf = buf
	this.str = str
	this.esc = esc.charCodeAt(0)
}

buffer_escapedSubRule.prototype.test = function (buf, offset) {
	var isString = typeof buf === 'string'
	var pattern = isString ? this.str : this.buf
	var n = pattern.length

	var esc = this.esc
	var len = buf.length

	if (len < offset + n) return -1

	var i = -1

	if (isString) {
		while (offset < len) {
			i = buf.indexOf(pattern, offset)
			if (i <= 0) break

			for (var esc_i = i, esc_num = 0; esc_i > 0 && buf.charCodeAt(--esc_i) === esc; esc_num++) {}

			if ( (esc_num % 2) === 0 ) return this.next.test(buf, i + n)
			offset = i + 1
		}
	} else {
		while (offset < len) {
			i = buf.indexOf(pattern, offset)
			if (i <= 0) break

			for (var esc_i = i, esc_num = 0; esc_i > 0 && buf[--esc_i] === esc; esc_num++) {}

			if ( (esc_num % 2) === 0 ) return this.next.test(buf, i + n)
			offset = i + 1
		}
	}

	if (this.length > 0) this.length = n

	return i < 0 ? -1 : this.next.test(buf, n)
}