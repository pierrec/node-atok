function buffer_array_loop_firstSubRule (buf, str) {
	// Common properties
	this.idx = -1
	this.length = 1
	this.next = lastSubRule
	// Specific properties
	this.buf = buf
	this.str = str
}

buffer_array_loop_firstSubRule.prototype.test = function (buf, offset) {
	var isString = typeof buf === 'string'
	var list = isString ? this.str : this.buf
	var bufLen = buf.length
	var len = list.length
	var pos = offset

	if (isString) {
		loop_String: while (pos < bufLen) {
			nextEntry_String: for (var j = 0; j < len; j++) {
				var p = list[j]
				var n = p.length

				if (bufLen < pos + n) continue nextEntry_String

				for (var i = 0; i < n; i++) {
					if ( buf.charCodeAt(pos+i) !== p[i] ) continue nextEntry_String
				}

				// Match, try for more
				pos += n
				continue loop_String
			}
			// No match, end of the main loop
			break
		}
	} else {
		loop_Buffer: while (pos < bufLen) {
			nextEntry_Buffer: for (var j = 0; j < len; j++) {
				var p = list[j]
				var n = p.length

				if (bufLen < pos + n) continue nextEntry_Buffer

				for (var i = 0; i < n; i++) {
					if ( buf[pos+i] !== p[i] ) continue nextEntry_Buffer
				}

				// Match, try for more
				pos += n
				continue loop_Buffer
			}
			// No match, end of the main loop
			break
		}
	}

	// At least one match if the offset changed
	return pos > offset ? this.next.test(buf, pos) : -1
}
