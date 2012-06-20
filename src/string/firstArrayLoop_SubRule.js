function firstArrayLoop_SubRule (list) {
	this.size = 0
	this.idx = -1
	this.n = list.length
	this.list = stringToCharCodes(list, true)
	this.token = false
//include("set_subrule_length.js")
}

firstArrayLoop_SubRule.prototype.exec = function (s, start) {
	var n = this.n, l = this.list
	var c = s.charCodeAt(start)
	var found = true

	// Check all patterns
	for (var i = 0; i < n; i++) {
		// Current pattern
		for (var a = l[i], j = 0, m = a.length; j < m; j++) {
			if ( s.charCodeAt(start + j) !== a[j] ) {
				found = false
				break
			}
		}
		if (found) {
			// First match
			var pos = start + m, len = s.length, j = i

			while (pos < len) {
				found = true
				// All patterns
				for (i = 0; i < n; i++) {
					// Current pattern
					for (var a = l[i], j = 0, m = a.length; j < m; j++) {
						if ( s.charCodeAt(pos + j) !== a[j] ) {
							found = false
							break
						}
					}
					if (found) break
				}
				if (!found) break

				pos += m
			}

			// this.idx = j
			this.size = m
			return pos - start
		}
	}

	return -1
}

