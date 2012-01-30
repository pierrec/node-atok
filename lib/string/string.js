module.exports = SubRule

function SubRule (s) {
	this.size = s.length
	this.idx = -1
	this.n = s.length
	this.str = s
}

SubRule.prototype.exec = function (s, start) {
	var idx = s.indexOf(this.str, start) // TODO indexOf
	return idx < 0 ? -1 : idx - start + this.n
}