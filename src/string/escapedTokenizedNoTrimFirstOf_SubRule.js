function escapedTokenizedNoTrimFirstOf_SubRule (list, esc) {
	this.size = 0
	this.idx = -1
	this.token = true
	this.n = list.length
	this.list = list
	this.esc = esc.charCodeAt(0)
}

escapedTokenizedNoTrimFirstOf_SubRule.prototype.exec = function (s, start, firstSize) {
	//include("firstOf_loop_escaped.js")

	// console.log('=>'+buf+'<=', res, this.size)
	if ( res < 0 ) return res

	this.size = -firstSize
	return s + this.list[ this.idx ]
}

