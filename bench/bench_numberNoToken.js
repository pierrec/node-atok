var assert = require('assert')

var Atok = require('atok')
var newAtok = require('..')

var atok = new Atok
var natok = new newAtok

function handler (token, idx, type) {
	assert.equal(token, 2)
}

atok.quiet(true).addRule(2, handler)
natok.quiet(true).addRule(2, handler)

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
