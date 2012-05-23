function number_SubRule (n) {
	// Common properties
	this.size = 0
	this.idx = -1
	this.token = true
	// Specific properties
	this.n = n
	this.length = n
}

number_SubRule.prototype.exec = function (s, start) {
  return s.length - start >= this.n ? s.substr(start, this.n) : -1
}

