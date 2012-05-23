function tokenizedFirstOf_SubRule (list) {
	this.size = 0
	this.idx = -1
	this.token = true
	this.n = list.length
	this.list = list
//include("set_subrule_length.js")
}

tokenizedFirstOf_SubRule.prototype.exec = function (s, start, firstSize) {
	//include("firstOf_loop.js")

	// console.log('=>'+s+'<=', res, this.size)
	return res < 0 ? -1 : s
}

