// var buf = s
var offset = start - firstSize // Include the first rule pattern
var l = this.list
var res = -1

this.size = 0

// Check all patterns
for (var i, j = 0, n = this.n; j < n && res !== firstSize; j++) {
	i = s.indexOf( l[j], offset + firstSize ) // TODO indexOf
	if (i >= 0) {
		//include("firstOf_found.js")
	}
}