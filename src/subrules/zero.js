function zero_SubRule () {
	// Common properties
	this.idx = -1
	this.length = 0
	this.next = lastSubRule
	this.prev = null
}

zero_SubRule.prototype.test = function (buf, offset) {
  return offset === buf.length
  	? this.next.test(buf, offset)
  	: -1
}