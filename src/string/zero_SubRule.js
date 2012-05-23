function zero_SubRule (n) {
	// Common properties
	this.size = 0
	this.idx = -1
	this.token = false
	this.length = 0
}

zero_SubRule.prototype.exec = function (s, start) {
  return start - s.length
}

