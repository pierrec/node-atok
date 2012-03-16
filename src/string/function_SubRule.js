function function_SubRule (list) {
	this.size = 0
	this.idx = -1
	this.token = false
	this.list = list
}

function_SubRule.prototype.exec = function (s, start) {
	var l = this.list
	var matched

	for (var i = 0, n = l.length; i < n; i++) {
		matched = l[i](s, start)
		if (matched >= 0) return (this.idx = i, this.size = matched)
	}

	return -1
}

