function tokenizedNoTrimFirstOf_SubRule (list) {
	this.size = 0
	this.idx = -1
	this.token = true
	this.n = list.length
	this.list = list
}

tokenizedNoTrimFirstOf_SubRule.prototype.exec = function (s, start, firstSize) {
	//include("firstOf_loop.js")

	// console.log('=>'+s+'<=', res, this.size)
	if ( res < 0 ) return res

	this.size = -firstSize
	return s + this.list[ this.idx ]
}

