var assert = require('assert')

var Atok = require('atok')
var newAtok = require('..')

var atok = new Atok
var natok = new newAtok

function handler (token, idx, type) {
	// assert.equal(token, 0)
}

atok.addRule('abc', handler)
natok.addRule('abc', handler)

var s = 'abc'
var buf = new Buffer(s)

var compare = exports.compare = {}
compare[Atok.version] = function () {
	atok.write(s)
}
compare[newAtok.version + ' buffer'] = function () {
	natok.write(buf)
}
compare[newAtok.version + ' string'] = function () {
	natok.write(s)
}
require("bench").runMain()
