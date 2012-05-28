var assert = require('assert')

var Atok = require('atok')
var newAtok = require('..')

var atok = new Atok
var natok = new newAtok

function handler (token, idx, type) {
	assert.equal(token, 'ab')
}

var options = { firstOf: [' ',','] }

atok.quiet(true).addRule(options, handler)
natok.quiet(true).addRule(options, handler)

var s = 'ab,'

var compare = exports.compare = {}
compare[Atok.version] = function () {
	atok.clear(true).write(s)
}
compare[newAtok.version] = function () {
	natok.clear(true).write(s)
}
require("bench").runMain()
