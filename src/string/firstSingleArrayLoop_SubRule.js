function firstSingleArrayLoop_SubRule (list) {
	this.size = 1
	this.idx = -1
	this.n = list.length
	this.list = stringToCharCodes(list)
	this.token = false
//include("set_subrule_length.js")
}

firstSingleArrayLoop_SubRule.prototype.exec = function (s, start) {
	var n = this.n, l = this.list
	var c = s.charCodeAt(start)

	for (var i = 0; i < n; i++) {
		if ( c === l[i] ) {
			// First match
			var pos = start + 1, len = s.length
			var found, j = i

			while (pos < len) {
				c = s.charCodeAt(pos)
				found = false
				for (i = 0; i < n; i++)
					if (c === l[i]) {
						found = true
						j = i
						break
					}

				if (!found) break
				pos++
			}

			// this.idx = j
			return pos - start
		}
	}
	return -1
}

