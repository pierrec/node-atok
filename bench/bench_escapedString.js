var assert = require('assert')

var Atok = require('atok')
var newAtok = require('..')

var atok = new Atok
var natok = new newAtok

function handler (token, idx, type) {
	assert.equal(token, 'a\\"bc')
}

atok.escaped(true).addRule('"', '"', handler)
natok.escaped(true).addRule('"', '"', handler)

var s = '"a\\"bc"'

var compare = exports.compare = {}
compare[Atok.version] = function () {
	atok.clear(true).write(s)
}
compare[newAtok.version] = function () {
	natok.clear(true).write(s)
}
require("bench").runMain()
