function startSingleRange_SubRule (start) {
	this.size = 1
	this.idx = -1
	this.start = toCharCodes(start)
	this.token = false
	this.length = 1
}

startSingleRange_SubRule.prototype.exec = function (s, start) {
	var c = s.charCodeAt(start)
	var l = this.start
	for (var i = 0, n = l.length; i < n; i++)
		if (c >= l[i]) return 1
	return -1
}

