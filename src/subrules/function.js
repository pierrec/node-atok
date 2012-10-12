function function_SubRule (fn) {
	// Common properties
	this.idx = -1
	this.length = 0
	this.next = null
	// Specific properties
	this.fn = fn
}

function_SubRule.prototype.test = function (buf, offset) {
	var res = this.fn.call(this, buf, offset)
	return res < 0
		? -1
		: this.next.test(buf, offset + res)
}