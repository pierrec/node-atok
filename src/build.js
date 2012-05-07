var fs = require('fs')
var path = require('path')
var exec = require('child_process').exec

var fstream = require('fstream')

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
  '// The content of this file was automatically generated during build time'
, 'function _MaskSetter (method /* , flag1, flag2... */) {'
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
}, function (err, files) {
  if (err) return console.error(err)

  function saveFile (filename, data, callback) {
    fstream
      .Writer({
        path: filename
      })
      .on('error', callback)
      .on('close', callback)
      .end(data)
  }

  // Build the documentation
  files
    .filter(function (file) {
      // Only document the main file
      return !/rule/.test(file)
    })
    .forEach(function (file) {
      var filename = path.basename(file, '.js')
      var outdir = path.join( __dirname, '..', 'doc')
      var packData = require( path.join( __dirname, '..', 'package.json') )

      exec('dox < ' + file, function (err, stdout, stderr) {
        if (err) return console.error(err, stderr)

        var tmpfile = path.join( outdir, filename + '.json' )

        saveFile(tmpfile, stdout, function (err) {
          if (err) return console.error(err)

          exec(
            'dox-template -n "' + packData.name + '" -r ' + packData.version + '  < ' + tmpfile
          , function (err, stdout, stderr) {
              if (err) return console.error(err, stderr)

              saveFile(
                path.join( outdir, filename + '.html' )
              , stdout
              , function (err) {
                  if (err) return console.error(err)
                }
              )
            }
          )
        })
      })
    })
})
