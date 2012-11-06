# ATOK - async tokenizer


## Overview

Atok is a fast, easy and dynamic tokenizer designed for use with [node.js](http://nodejs.org). It is based around the [Stream](http://nodejs.org/docs/latest/api/streams.html) concept and is implemented as a read/write one.

It was originally inspired by [node-tokenizer](https://github.com/floby/node-tokenizer), but quickly grew into its own form as I wanted it to be RegExp agnostic so it could be used on node Buffer intances and more importantly *faster*.

Atok is built using [ekam](https://github.com/pierrec/node-ekam) as it abuses includes and dynamic method generation.

Atok is the fundation for the [atok-parser](https://github.com/pierrec/node-atok-parser), which provides the environment for quickly building efficient and easier to maintain parsers.


## Core concepts

First let's see some definitions. In atok's terms:

* a `subrule` is an atomic check against the current data. It can be represented by a user defined function (rarely), a string or a number, or an array of those, as well as specific objects defining a range of values for instance (e.g. { start: 'a', end: 'z' } is equivalent to /[a-z]/ in RegExp)
* a `rule` is an __ordered__ combination of subrules. Each subrule is evaluated in order and if any fails, the whole rule is considered failed. If all of them are valid, then the handler supplied at rule instanciation is triggered, or if none was supplied, a data event is emitted instead.
* a `ruleSet` is a list of `rules` that are saved under a given name. Using `ruleSets` is useful when writting a parser to break down its complexity into smaller, easier to solve chunks. RuleSets can be created or altered __on the fly__ by any of its handlers.
* a `property` is an option applicable to the current rules being created.
    * properties are set using their own methods. For instance, a `rule` may load a different `ruleSet` upon match using `next()`
    * properties are defined before the rules they need to be applied to. E.g. atok.next('rules2').addRule(...)
    * once defined, properties are applied to all subsequent rules, unless turned off by calling the property method with no argument or false. E.g. in atok.next('rules2').addRule(...).addRule(...).next().addRule(...) only rule 1 and 2 will load the `ruleSet` _rules2_ if they match.


The default workflow in atok is as follow:

* data is provided to the tokenizer
* the tokenizer evaluates each of its `rules` against it (its current `ruleSet`)
    * if none match, it stops and waits for more
    * if one matches, it triggers the handler/emit an event, then go back to rules evaluation


The default workflow can be altered using the `continue()` and `next()` property methods:

* `continue(jump[, jumpOnFail])`: the next `rule` being checked is relative to the one that matched, downward if jump value is positive, upward if negative. In case the `rule` fails, by default, the tokenizer will process to the next one. This can be modified by specifying the jumpOnFail value.
    * `continue(0)`: go to the next `rule` on success
    * `continue(-1)`: reevaluate the current `rule` on success
    * `continue(-2)`: go to the previous `rule` on success
* `next(ruleSet[, index])`: when the handler returns, the tokenizer will evaluate rules from the new `ruleSet`, starting at the first one or the one at _index_.


It is important to note that the tokenizer is _highly_ dynamic:

* `ruleSets` can be changed by handlers
* `rules` and `ruleSets` can be created by handlers based on the data being processed
* after a match, the tokenizer can branch to a different `ruleSet`


## Download

Atok is published on node package manager (npm). To install, do:

    npm install atok


## Quick example

Given the following json to be parsed:

    ["Hello world!"]

The following code would be a very simple JSON parser for it.

``` javascript
var Tokenizer = require('atok')
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
    .escaped(true)
        .addRule('"', '"', 'string')
    .escaped()
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

// Send some data to be parsed!
tok.end('[ "Hello", "world!" ]')
```

__Output__

    results is object with 1 item(s)
    results: [ 'Hello world!' ]


## Documentation

See [here](http://pierrec.github.com/node-atok/).


## Testing

Atok has a fairly extended set of tests written for [mocha](https://github.com/visionmedia/mocha). See the [test](https://github.com/pierrec/node-atok/tree/master/test) directory.


## Issues

See the TODO file.


## License

MIT [Here](https://github.com/pierrec/node-atok/tree/master/LICENSE)