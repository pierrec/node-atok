function number_SubRule (n) {
	// Common properties
	this.size = 0
	this.idx = -1
	this.length = n
	this.next = null
	// Specific properties
	this.n = n
}

number_SubRule.prototype.test = function (buf, offset) {
  return offset + this.n <= buf.length
  	? this.next.test(buf, offset + this.n)
  	: -1
}