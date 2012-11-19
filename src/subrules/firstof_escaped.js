function firstof_escaped_object_SubRule (buf, str, esc) {
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

firstof_escaped_object_SubRule.prototype.test = function (buf, offset) {
	var isString = typeof buf === 'string'
	var list = isString ? this.str : this.buf

	var _buf = buf
	var _offset = offset
	var pattern
	var from = offset
	var n = buf.length
	this.idx = -1

	if (isString) {
		for (var j = 0, len = list.length; j < len && from < n; j++) {
			var p = list[j]
			var i = _buf.indexOf( p, from )

			if (i >= 0) {
				// Look for escape char
				for (var esc_i = i, esc_num = 0; esc_i > 0 && _buf.charCodeAt(--esc_i) === this.esc; esc_num++) {}

				if ( (esc_num % 2) === 0 ) {
					pattern = p
					if (this.length > 0) this.length = p.length
					this.idx = j

					_buf = _buf.slice(_offset, i)
					_offset = 0
				} else {
					// Escaped: ignore this match
					from++
				}
			}
		}
	} else {
		for (var j = 0, len = list.length; j < len && from < n; j++) {
			var p = list[j]
			var i = _buf.indexOf( p, from )

			if (i >= 0) {
				// Look for escape char
				for (var esc_i = i, esc_num = 0; esc_i > 0 && _buf[--esc_i] === this.esc; esc_num++) {}

				if ( (esc_num % 2) === 0 ) {
					pattern = p
					if (this.length > 0) this.length = p.length
					this.idx = j

					_buf = _buf.slice(_offset, i)
					_offset = 0
				} else {
					// Escaped: ignore this match
					from++
				}
			}
		}
	}

	if (this.idx < 0) return -1

	return this.next.test(buf, offset + _buf.length + pattern.length)
}