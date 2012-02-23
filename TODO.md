# TODO

## API

	* EventEmitter -> ev
	* custom Rule#test() based on props: noToken, trimLeft... (using ekam to duplicate code)
	* implement debug tools for rules
		* rule/subrule triggered
		* step by step
	* better utf-8 support - use a decoding stream upfront of atok? (also applies to other encodings)
	* Buffer support

## Features

	* additional encodings (currently=UTF-8): binary? base64? ...

## Documentation

	* Rewrite: API / Methods / Members

## Performance

	* faster EventEmitter
	* remove [match] event -> overload rule#test()
  * subrules linked execution
	* handler signature: token idx, type => rule object ?
	* ruleString: cache charCodes for use in subsequent rules -> slower!
	* use npb to build .js file per property (trimLeft, trimRight)
	* #compile(): rules + subrules into one .js required() at runtime
	* turn string typed handler into smaller handlers using Uglify parser

## Known issues

	* rules with 0 are ignored in arrays (i.e. `addRule([0,123])`)
	* When listeners are attached, emitting the match event introduces a major performance penalty using node's default EventEmitter. This will be fixed in the next revision.