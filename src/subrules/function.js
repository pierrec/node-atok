function function_SubRule (fn) {
	// Common properties
	this.idx = -1
	this.length = -1
	this.next = lastSubRule
	// Specific properties
	this.fn = fn
}

function_SubRule.prototype.test = function (buf, offset) {
	var res = this.fn.call(this, buf, offset)

	if (typeof res !== 'number' || res < 0) return -1

	this.length = res

	return	this.next.test(buf, offset + res)
}