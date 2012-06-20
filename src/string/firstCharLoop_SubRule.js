function firstCharLoop_SubRule (c) {
	// Common properties
	this.size = 1
	this.idx = -1
	// Specific properties
	this.c = c.charCodeAt(0)
	this.token = false
	this.length = 1
}

firstCharLoop_SubRule.prototype.exec = function (s, start) {
	if (s.charCodeAt(start) !== this.c) return -1

	var c = this.c
	var pos = start + 1, n = s.length
	
	while (pos < n) {
		if (s.charCodeAt(pos) !== c) break
		pos++
	}
	return pos - start
}

