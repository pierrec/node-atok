function firstOf_SubRule (list) {
	this.size = 0
	this.idx = -1
	this.n = list.length
	this.list = list
	this.token = false
//include("set_subrule_length.js")
}

firstOf_SubRule.prototype.exec = function (s, start) {
	var firstSize = 0

	//include("firstOf_loop.js")

	return res + this.size
}

