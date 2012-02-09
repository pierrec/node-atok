# TODO

## API

	* better utf-8 support - use a decoding stream upfront of atok? (also applies to other encodings)
	* Buffer support
	* allow token to be split per subrule 2 to n
	i.e. addRule('a', 'b', 'c') on 'a123b456c' emits/calls handler with: ['123','456'] instead of '123b456'
	* implement debug tools for rules
		* rule/subrule triggered
		* step by step
	* #includeRule(rule name, [rules set]) - use current rule set if none provided
	* #includeRuleSet(rule set)

## Features

	* additional encodings (currently=UTF-8): binary? base64? ...

## Documentation

	* Rewrite: API / Methods / Members

## Performance

	* faster EventEmitter ?
	* handler signature: token idx, type => rule object ?
	* ruleString: cache charCodes for use in subsequent rules -> slower!
	* use npb to build .js file per property (trimLeft, trimRight)
	* #compile(): rules + subrules into one .js required() at runtime
	* turn string typed handler into smaller handlers using Uglify parser

## Known issues

	* rules with 0 are ignored in arrays (i.e. `addRule([0,123])`)
	* When listeners are attached, emitting the match event introduces a major performance penalty using node's default EventEmitter. This will be fixed in the next revision.