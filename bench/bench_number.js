var assert = require('assert')

var Atok = require('atok')
var newAtok = require('..')

var atok = new Atok
var natok = new newAtok

function handler (token, idx, type) {
	assert.equal(token, 'abc')
}

atok.setEncoding()
atok.addRule(3, handler)
natok.setEncoding()
natok.addRule(3, handler)

// Converting a string to a buffer is *expensive*
// a lot more than vice-versa
var s = 'abc'
var buf = new Buffer(s)

var compare = exports.compare = {}
compare[Atok.version] = function () {
	atok.clear(true).write(s)
}
compare[newAtok.version + ' string'] = function () {
	natok.clear(true).write(s)
}
compare[newAtok.version + ' buffer'] = function () {
	natok.clear(true).write(buf)
}
require("bench").runMain()
