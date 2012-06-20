function firstStringLoop_SubRule (s) {
	this.size = s.length
	this.idx = -1
	this.n = s.length
	this.str = s
	this.token = false
	this.length = s.length
}

firstStringLoop_SubRule.prototype.exec = function (s, start) {
	if (s.length < start + this.n) return -1

	var p = this.str, n = this.n

	// First match?
	for (var i = 0; i < n; i++)
		if (s[i+start] !== p[i]) return -1

	// First match, check for more
	var pos = start, len = s.length, notFound = false

	while ( (pos += n) < len) {
		for (i = 0; i < n; i++)
			if ( s[i+start] !== p[i] ) {
				notFound = true
				break
			}

		if (notFound) break
	}

	return pos - start
}

