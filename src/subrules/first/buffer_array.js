function buffer_array_firstSubRule (buf, str) {
	// Common properties
	this.idx = -1
	this.length = 1
	this.next = null
	// Specific properties
	this.buf = buf
	this.str = str
}

buffer_array_firstSubRule.prototype.test = function (buf, offset) {
	var isString = typeof buf === 'string'
	var list = isString ? this.str : this.buf

	if (isString) {
		for (var j = 0, len = list.length; j < len; j++) {
			var p = list[j]
			var n = p.length

			if (buf.length < offset + n) continue

			for (var i = 0; i < n; i++) {
				if ( buf.charCodeAt(offset+i) !== p[i] ) break
			}

			if (i === n) {
				if (this.length > 0) this.length = n
				this.idx = j

				return this.next.test(buf, offset + n)
			}
		}
	} else {
		for (var j = 0, len = list.length; j < len; j++) {
			var p = list[j]
			var n = p.length

			if (buf.length < offset + n) continue

			for (var i = 0; i < n; i++) {
				if ( buf[offset+i] !== p[i] ) break
			}

			if (i === n) {
				if (this.length > 0) this.length = n
				this.idx = j

				return this.next.test(buf, offset + n)
			}
		}
	}

	return -1
}