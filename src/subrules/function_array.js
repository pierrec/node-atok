function function_arraySubRule (list) {
	// Common properties
	this.idx = -1
	this.length = -2
	this.next = lastSubRule
	this.prev = null
	// Specific properties
	this.list = list
}

function_arraySubRule.prototype.test = function (buf, offset) {
	var list = this.list

	for (var i = 0, n = list.length; i < n; i++) {
		var res = list[i].call(this, buf, offset)
		if (typeof res === 'number' && res >= 0) {
			this.idx = i
			if (this.length !== 0) this.length = res

			return this.next.test(buf, offset + res)
		}
	}

	return -1
}