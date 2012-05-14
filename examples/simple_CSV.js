/*
    This is a rudimentary CSV parser, for a more complete example see csv.js
    In this simple version, the data must not contain any coma
    and double quotes are not processed.
**/
var Tokenizer = require('..')
var tok = new Tokenizer

// Define the parser rules
var eol = ['\n','\r\n']
var sep = ','
// Handlers are used instead of events
tok
    // Ignore comments
    .ignore(true) // On rule match, do not do anything, skip the token
        .addRule('#', eol, 'comment')
    .ignore() // Turn the ignore property off
    // Anything else is data
    // Rule definition:
    // first argument: always an exact match. To match anything, use ''
    // next arguments: array of possible matches (first match wins)
    .addRule('', { firstOf: [ sep ].concat(eol) }, function handler (token, idx) {
        // token=the matched data
        // idx=when using array of patterns, the index of the matched pattern
        // Newline?
        if (firstLine) data.push([])
        // Add the data
        data[ data.length-1 ].push(token)
        // EOL reached
        firstLine = idx > 0
    })
    // End reached
    .on('end', function (token, idx, type) {
        console.log('found', data.length, 'line(s)')
        console.log('lines:', data)
        data = []
    })

// Setup some variables
var data = []
var firstLine = true

// Toggle debug on/off
// tok.debug(true)
// tok.debug()
tok.on('debug', console.log)

// Send some data to be parsed!
tok.end('# Comment\n1,2,3\nabc\n')