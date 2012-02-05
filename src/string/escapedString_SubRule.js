function escapedString_SubRule (s, esc) {
	this.size = s.length
	this.idx = -1
	this.n = s.length
	this.str = s
	this.esc = esc.charCodeAt(0)
}

escapedString_SubRule.prototype.exec = function (s, start) {
	var offset = start, i, res
	, n = s.length
	, esc = this.esc

	while (offset < n) {
	i = s.indexOf(this.str, offset) // TODO indexOf
	if (i > 0) {
		// Check escaped pattern - '\\'.charCodeAt(0) === 92
		for (var j = i, c = 0; j > 0 && s[--j].charCodeAt(0) == esc; c++) {}
			if ((c % 2) == 0) return i - start + this.n
			offset = i + 1
		} else {
	  		return i < 0 ? -1 : this.n
		}
	}
	return -1
}

