var assert = require('assert')

var Atok = require('atok')
var newAtok = require('..')

var atok = new Atok
var natok = new newAtok

function handler (token, idx, type) {
	assert.equal(token, 0)
}

atok.addRule('abc', handler)
natok.addRule('abc', handler)

var s = 'abc'

exports.compare = {
	"current" : function () {
		atok.clear(true).write(s)
	}
, "new" : function () {
		natok.clear(true).write(s)
	}
}
require("bench").runMain()
