function firstArray_SubRule (list) {
	this.size = 0
	this.idx = -1
	this.n = list.length
	this.list = stringToCharCodes(list, true)
	this.token = false
//include("set_subrule_length.js")
}

firstArray_SubRule.prototype.exec = function (s, start) {
	for (var i = 0, n = this.n, l = this.list; i < n; i++) { // Patterns
		for (var a = l[i], j = 0, m = a.length; j < m; j++) { // Match?
			if ( s.charCodeAt(start + j) !== a[j] ) break
		}
		if (j === m) return (this.idx = i, this.size = m)
	}
	return -1
}

