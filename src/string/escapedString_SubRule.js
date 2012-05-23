function escapedString_SubRule (s, esc) {
	this.size = s.length
	this.idx = -1
	this.n = s.length
	this.str = s
	this.esc = esc.charCodeAt(0)
	this.token = false
	this.length = s.length
}

escapedString_SubRule.prototype.exec = function (s, start) {
	var offset = start, i, res
	, n = s.length

	while (offset < n) {
		i = s.indexOf(this.str, offset) // TODO indexOf
		if (i > 0) {
			//include("check_escaped.js")
			return i - start + this.n
			offset = i + 1
		} else {
	  		return i < 0 ? -1 : this.n
		}
	}
	return -1
}

