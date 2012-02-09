function startendSingleRange_SubRule (start, end) {
	this.size = 1
	this.idx = -1
	this.token = false

	var _start = toCharCodes(start)
	var _end = toCharCodes(end)
	this.list = []
	for (var i = 0, n = _start.length; i < n; i++) {
		this.list.push( _start[i], _end[i] )
	}
}

startendSingleRange_SubRule.prototype.exec = function (s, start) {
	var c = s.charCodeAt(start)
	var l = this.list
	for (var i = 0, n = l.length; i < n; i++)
		if (c >= l[i++] && c <= l[i]) return 1
	return -1
}

