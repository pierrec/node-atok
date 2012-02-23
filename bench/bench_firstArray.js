var assert = require('assert')

var Atok = require('atok')
var newAtok = require('..')

var atok = new Atok
var natok = new newAtok

function handler (token, idx, type) {
	assert.equal(token, 0)
}

var options = ['aa','bb']

atok.addRule(options, handler)
natok.addRule(options, handler)

var s = 'aabb'

exports.compare = {
	"current" : function () {
		atok.clear(true).write(s)
	}
, "new" : function () {
		natok.clear(true).write(s)
	}
}
require("bench").runMain()
