var assert = require('assert')

var Atok = require('atok')
var newAtok = require('..')

var atok = new Atok
var natok = new newAtok

function handler (token, idx, type) {
	assert.equal(token, 'a\\"bc')
}

atok.escape(true).addRule('"', '"', handler)
natok.escape(true).addRule('"', '"', handler)

var s = '"a\\"bc"'
var buf = new Buffer(s)

var compare = exports.compare = {}
compare[Atok.version] = function () {
	atok.write(s)
}
compare[newAtok.version + ' string'] = function () {
	natok.write(s)
}
compare[newAtok.version + ' buffer'] = function () {
	natok.write(buf)
}
require("bench").runMain()
