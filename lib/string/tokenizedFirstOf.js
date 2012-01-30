module.exports = SubRule

function SubRule (list) {
	this.size = 0
	this.idx = -1
	this.token = true
	this.n = list.length
	this.list = list
}

SubRule.prototype.exec = function (s, start, firstSize) {
	var buf = s
	, offset = start - firstSize // Include the first rule pattern
	var l = this.list
	var res = -1
	this.size = 0

	// Check all patterns
	for (var i, j = 0, n = this.n; j < n && res != firstSize; j++) {
		// Exclude the first rule pattern from the search!
		i = buf.indexOf( l[j], offset + firstSize )
		// TODO indexOf
		// console.log('*'+buf, offset, firstSize, i)
		if (i >= 0) {
			this.size = l[j].length - firstSize // Do not include first rule pattern as already counted in Rule
			this.idx = j
			res = i - offset
			// Reduce the scope of the pattern search, including the first rule pattern
			buf = buf.substr(offset, res)
			// console.log('**'+buf, offset, res)
			offset = 0
		}
	}

	// console.log('=>'+buf+'<=', res, this.size)
	return res < 0 ? -1 : buf
}