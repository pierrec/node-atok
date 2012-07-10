/*
    Simple JSON parser (only supports an Array of strings!)
    Illustrates how to define basic rules
    The tokenizer is defined as a Stream emitter
**/
var Tokenizer = require('..')
var tok = new Tokenizer

// Define the parser rules
// By default it will emit data events when a rule is matched
tok
    // Define the quiet property for the following rules (quiet=dont tokenize but emit/trigger the handler)
    // Only used to improve performance
    .quiet(true)
        // first argument is a match on the current position in the buffer
        .addRule('[', 'array-start')
        .addRule(']', 'array-end')
    .quiet() // Turn the quiet property off
    // The second pattern will only match if it is not escaped (default escape character=\)
    .escape(true)
        .addRule('"', '"', 'string')
    .escape()
    // Array item separator
    .addRule(',', 'separator')
    // Skip the match, in this case whitespaces
    .ignore(true)
        .addRule([' ','\n', '\t','\r'], 'whitespaces')
    .ignore()

// Setup some variables
var stack = []
var inArray = false

// Attach listeners to the tokenizer
tok.on('data', function (token, idx, type) {
    // token=the matched data
    // idx=when using array of patterns, the index of the matched pattern
    // type=string identifiers used in the rule definition
    switch (type) {
        case 'array-start':
            stack.push([])
            inArray = true
        break
        case 'array-end':
            inArray = false
        break
        case 'string':
            if (inArray)
                stack[ stack.length-1 ].push(token)
            else
                throw new Error('only Arrays supported')
        break
        case 'separator':
        break
        default:
            throw new Error('Unknown type: ' + type)
    }
})
tok.on('end', function () {
    console.log('results is of type', typeof stack[0], 'with', stack[0].length, 'item(s)')
    console.log('results:', stack[0])
})

// To turn debug on
// tok.debug(true).on('debug', console.log)

// Send some data to be parsed!
tok.end('[ "Hello", "world!" ]')