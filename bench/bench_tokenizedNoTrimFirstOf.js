var assert = require('assert')

var Atok = require('atok')
var newAtok = require('..')

var atok = new Atok
var natok = new newAtok

function handler (token, idx, type) {
	assert.equal(token, 'ab,')
}

var options = { firstOf: [' ',','] }

atok.trimRight(false).addRule(options, handler)
natok.trimRight(false).addRule(options, handler)

var s = 'ab,'

exports.compare = {
	"current" : function () {
		atok.clear(true).write(s)
	}
, "new" : function () {
		natok.clear(true).write(s)
	}
}
require("bench").runMain()
