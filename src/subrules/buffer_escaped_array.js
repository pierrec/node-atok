function buffer_escaped_arraySubRule (buf, str, esc) {
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

buffer_escaped_arraySubRule.prototype.test = function (buf, offset) {
	var isString = typeof buf === 'string'
	var list = isString ? this.str : this.buf
	var len = buf.length

	for (var j = 0, num = list.length; j < num; j++) {
		var p = list[j]
		var n = p.length

		if (buf.length < offset + n) continue

		var i = -1

		if (isString) {
			while (offset < len) {
				i = buf.indexOf(p, offset)
				if (i < 0) break

				for (var esc_i = i, esc_num = 0; esc_i > 0 && buf.charCodeAt(--esc_i) === this.esc; esc_num++) {}

				if ( (esc_num % 2) === 0 ) {
					if (this.length > 0) this.length = n
					this.idx = j

					return this.next.test(buf, i + n)
				}

				offset = i + 1
			}
		} else {
			while (offset < len) {
				i = buf.indexOf(p, offset)
				if (i < 0) break

				for (var esc_i = i, esc_num = 0; esc_i > 0 && buf[--esc_i] === this.esc; esc_num++) {}

				if ( (esc_num % 2) === 0 ) {
					if (this.length > 0) this.length = n
					this.idx = j

					return this.next.test(buf, i + n)
				}

				offset = i + 1
			}
		}
	}

	return -1
}