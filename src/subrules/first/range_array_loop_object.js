function range_array_loop_object_firstSubRule (start, end) {
	// Common properties
	this.idx = -1
	this.length = 1
	this.next = lastSubRule
	// Specific properties
	this.start = start
	this.end = end
}

range_array_loop_object_firstSubRule.prototype.test = function (buf, offset) {
	var isString = typeof buf === 'string'
	var start = this.start
	var end = this.end
	var len = start.length // Same length as this.end
	var pos = offset
	var bufLen = buf.length

	if (isString) {
		loop_String: while (pos < bufLen) {
			for (var i = 0; i < len; i++) {
				var c = buf.charCodeAt(pos)
				if ( c >= start[i] && c <= end[i] ) {
					// Match, try for more
					pos++
					continue loop_String
				}
			}
			// No match, end of the main loop
			break
		}
	} else {
		loop_Buffer: while (pos < bufLen) {
			for (var i = 0; i < len; i++) {
				var c = buf[offset]
				if ( c >= start[i] && c <= end[i] ) {
					// Match, try for more
					pos++
					continue loop_Buffer
				}
			}
			// No match, end of the main loop
			break
		}
	}

	// At least one match if the offset changed
	return pos > offset ? this.next.test(buf, pos) : -1
}
