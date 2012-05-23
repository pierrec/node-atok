function escapedFirstOf_SubRule (list, esc) {
	this.size = 0
	this.idx = -1
	this.n = list.length
	this.list = list
	this.token = false
	this.esc = esc.charCodeAt(0)
//include("set_subrule_length.js")
}

escapedFirstOf_SubRule.prototype.exec = function (s, start) {
	var firstSize = 0

	//include("firstOf_loop_escaped.js")

	return res + this.size
}

