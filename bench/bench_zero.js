var assert = require('assert')

var Atok = require('atok')
var newAtok = require('..')

var atok = new Atok
var natok = new newAtok

function handler (token, idx, type) {
	assert.equal(token, false)
}

atok.addRule(1, 'consume')
atok.addRule(0, handler)
natok.addRule(1, 'consume')
natok.addRule(0, handler)

var s = 'a'

var compare = exports.compare = {}
compare[Atok.version] = function () {
	atok.clear(true).write(s)
}
compare[newAtok.version] = function () {
	natok.clear(true).write(s)
}
require("bench").runMain()
