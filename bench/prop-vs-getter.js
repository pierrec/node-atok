function const1 () {
	this.length = 0
}
function const2 () {
	this._length = 0
}
const2.prototype.__defineGetter__('length', function () {
  return this._length
})

var a = new const1
var b = new const2

exports.compare = {
	"property": function () {
		var len = a.length
}
, "getter": function () {
	var len = b.length
}
}
require("bench").runMain()
