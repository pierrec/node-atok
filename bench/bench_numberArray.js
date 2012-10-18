var assert = require('assert')

var Atok = require('atok')
var newAtok = require('..')

var atok = new Atok
var natok = new newAtok

function handler (token, idx, type) {
	// assert.equal(token, 'ab')
}

atok.addRule([3,2], handler)
natok.addRule([3,2], handler)

var s = 'abc'
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
