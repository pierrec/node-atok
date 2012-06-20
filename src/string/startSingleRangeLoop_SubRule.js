function startSingleRangeLoop_SubRule (start) {
	this.size = 1
	this.idx = -1
	this.start = toCharCodes(start)
	this.token = false
	this.length = 1
}

startSingleRangeLoop_SubRule.prototype.exec = function (s, start) {
	var c = s.charCodeAt(start)
	var l = this.start

	for (var i = 0, n = l.length; i < n; i++) {
		if (c >= l[i]) {
			// First match, now check following data
			var pos = start + 1, len = s.length, found

			while (pos < len) {
				c = s.charCodeAt(pos)
				for (i = 0; i < n; i++) {
					if ( found = (c >= l[i]) ) break
				}
				if (!found) break
				pos++
			}

			return pos - start
		}
	}

	return -1
}

