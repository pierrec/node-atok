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

exports.compare = {
	"current" : function () {
		atok.clear(true).write(s)
	}
, "new" : function () {
		natok.clear(true).write(s)
	}
}
require("bench").runMain()
