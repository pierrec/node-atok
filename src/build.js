var fs = require('fs')
var path = require('path')

// Define the Rule#test method as a masked method
/*
  for each flag, generate a unique method based on a shared code
  -> optimize the method based on user defined flags (avoid unnecessary if()s)
  -> only useful in highly demanding scenarii
**/
var methodName = 'test'
var vars = 'RULE_GENERATES_TOKEN RULE_TRIMLEFT RULE_TRIMRIGHT DEBUG'.split(' ')
var data = []
  , n = vars.length
  , res = new Array(32) // 32bits integer -> array of its bits

// Masked method setter:
// call this function to set the right method based on incoming flags
data.push(
  'function _MaskSetter (method /* , flag1, flag2... */) {'
// Convert the list of flags to an integer
, '  for (var int = 0, j = 33; --j;) {'
, '    int = int | (arguments[j] ? 1 : 0)'
, '    if (j > 1) int = int << 1'
, '  }'
, '  this[method] = this[ method + "_" + int ]'
, '}'
, ''
)

// Number of possible cases: 2^n, where n is the number of boolean variables
for (var i = 0, num = Math.pow(2, n); i < num; i++) {
  // Convert the current number into an array of bits
  for (var int = i, j = 0; j < 32; j++) {
    res[j] = int & 1
    int = int >> 1
  }

  var _vars = vars
      .map(function (vname, idx) { return vname + '=' + res[idx] })
      .join(',')
  // Add the list of variables and the associated method
  data.push(
    '// ' + _vars
  , '//var ' + _vars
  , 'Rule.prototype.' + methodName + '_' + i + ' = '
  + '//include("rule#' + methodName + '.js")'
  )
}
data.push('')

// Save the methods to a file
fs.writeFileSync(
  path.join( __dirname, 'string/rule#' + methodName + '_masked.js' )
, data.join('\n')
)

build({
  "input": {
    "include": "**/*.js",
    "exclude": "build.json build.js"
  },
  "output": {
    "path": "../lib",
    "mode": "0755",
    "clean": true
  }
})
