function firstof_object_SubRule (buf, str) {
	// Common properties
	this.idx = -1
	this.length = 1
	this.next = lastSubRule
	this.prev = null
	// Specific properties
	this.buf = buf
	this.str = str
}

firstof_object_SubRule.prototype.test = function (buf, offset) {
	var isString = typeof buf === 'string'
	var list = isString ? this.str : this.buf

	var _buf = buf
	var _offset = offset
	var pattern
	this.idx = -1

	for (var j = 0, len = list.length; j < len; j++) {
		var p = list[j]
		var i = _buf.indexOf( p, _offset )

		if (i >= 0) {
			pattern = p
			if (this.length > 0) this.length = p.length
			this.idx = j

			_buf = _buf.slice(_offset, i)
			_offset = 0
		}
	}

	if (this.idx < 0) return -1

	return this.next.test(buf, offset + _buf.length + pattern.length)
}