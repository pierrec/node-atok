/*
    CSV parser
    1st argument: input data file name
**/
/*
 sep {String} character used as separator
 toNumber {Boolean} try to convert values to a Number
 quotedData {Boolean} data items may be double-quoted
 linesToDisplay {Integer} number of lines to show
**/
var sep = ';'
var toNumber = true
var quotedData = true
var linesToDisplay = 10

//-----------------------------------------------------------------------------
var fs = require('fs')
var fileName = process.argv[2]
var file = fs.createReadStream(fileName)

var Tokenizer = require('..')
var tok = new Tokenizer       // Main parser
var stringtok = new Tokenizer // String processing - replaces "" with "

// Variables used by the parsers handlers
var data, firstLine, currentString

// Init helper
function init () {
  data = []
  firstLine = true
  currentString = ''
}
// Add a new line to the data array
function addLine (idx) { // Initialize a line if it is new (eol chars in array starting at 1)
  if (firstLine) data.push([])
  firstLine = idx
}
// Parser handlers
function stringHandler (token, idx) {
  addLine(idx)
  currentString = ''
  stringtok.write(token)
  data[ data.length-1 ].push(currentString)
}
function rawStringHandler (token, idx) {
  addLine(idx)
  data[ data.length-1 ].push( token.toString() )
}
function emptyHandler (token, idx) {
  addLine(idx)
  data[ data.length-1 ].push('')
}
function numberHandler (token, idx) {
  addLine(idx)
  var num = Number(token)
  // Valid Number?
  data[ data.length-1 ].push( isFinite(num) ? num : token.toString() )
}

// Define the main parser rules
var eol = ['\n','\r\n']
var term = [ sep ].concat(eol)
var stringTerm = term.map(function (v) { return '"' + v })
tok
  .next('line') // Load the given ruleSet after handler/emit
  // Comments
  .ignore(true)
      .addRule('#', eol, 'comment') // Ignore any line starting with #
  .ignore()
  // Empty column or end of line
  .addRule(term, emptyHandler)

if (quotedData)
  tok
  // Quoted string
  .escape('"') // Use " as the escape character
    .addRule('"', stringTerm, stringHandler)
  .escape()

tok
  // Number or unquoted string
  // firstOf will pick the item that matches first, meaning the token will not
  // contain any of the specified matches
  .addRule('', { firstOf: term }, toNumber ? numberHandler : rawStringHandler)
  .saveRuleSet('lineStart') // Save all above rules to 'lineStart'

  .removeRule('comment')
  .saveRuleSet('line') // A copy of 'lineStart' without the check for comments

// String tokenizer - basically does a .replace('""', '"')
// It is much slower than String.prototype.replace() but is there for illustration
stringtok
  .addRule('', '""', function (token) { currentString += token; currentString += '"' })
  .addRule('', function (token) { currentString += token })

tok.on('error', function (err) { throw err })
tok.on('end', function (token, idx, type) {
  console.log('found', data.length, 'line(s)')
  if (data.length > 0) console.log('found', data[0].length, 'column(s)')
  console.log('first %d lines:', linesToDisplay, data.slice(0, linesToDisplay))
  init()
})

init()

// Parse the file
file.pipe(tok)