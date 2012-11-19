function function_SubRule (fn) {
	// Common properties
	this.idx = -1
	this.length = -2
	this.next = lastSubRule
	this.prev = null
	// Specific properties
	this.fn = fn
}

function_SubRule.prototype.test = function (buf, offset) {
	var res = this.fn.call(this, buf, offset)

	if (typeof res !== 'number' || res < 0) return -1

	if (this.length !== 0) this.length = res

	return	this.next.test(buf, offset + res)
}