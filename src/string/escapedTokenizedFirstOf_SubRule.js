function escapedTokenizedFirstOf_SubRule (list, esc) {
	this.size = 0
	this.idx = -1
	this.token = true
	this.n = list.length
	this.list = list
	this.esc = esc.charCodeAt(0)
}

escapedTokenizedFirstOf_SubRule.prototype.exec = function (s, start, firstSize) {
	//include("firstOf_loop_escaped.js")

	// console.log('=>'+s+'<=', res, this.size)
	return res < 0 ? -1 : s
}

