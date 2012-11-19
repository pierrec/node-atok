function rangestart_loop_object_firstSubRule (start) {
	// Common properties
	this.idx = -1
	this.length = 1
	this.next = lastSubRule
	// Specific properties
	this.start = start
}

rangestart_loop_object_firstSubRule.prototype.test = function (buf, offset) {
	var isString = typeof buf === 'string'
	var start = this.start
	var pos = offset
	var bufLen = buf.length

	if (isString) {
		while (pos < bufLen) {
			var c = buf.charCodeAt(pos)
			// No match, end of the main loop
			if ( c < start ) break

			// Match, try for more
			pos++
		}
	} else {
		while (pos < bufLen) {
			var c = buf[offset]
			// No match, end of the main loop
			if ( c < start ) break

			// Match, try for more
			pos++
		}
	}

	// At least one match if the offset changed
	return pos > offset ? this.next.test(buf, pos) : -1
}