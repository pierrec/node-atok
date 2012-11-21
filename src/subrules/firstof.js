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
	var idx = -1

	for (var j = 0, len = list.length; j < len; j++) {
		var p = list[j]
		var i = _buf.indexOf( p, _offset )

		if (i < 0) continue

		pattern = p
		idx = j

		_buf = _buf.slice(_offset, i)
		_offset = 0
	}

	this.idx = idx

	if (idx < 0) return -1

	if (this.length > 0) this.length = pattern.length

	return this.next.test(buf, offset + _buf.length + pattern.length)
}