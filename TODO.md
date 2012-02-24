# TODO

## API

	* better utf-8 support - use a decoding stream upfront of atok? (also applies to other encodings)
	* Buffer support

## Features

	* additional encodings (currently=UTF-8): binary? base64? ...

## Documentation

	* Rewrite: API / Methods / Members

## Performance

	* subrules linked execution
	* handler signature: token idx, type => rule object ?
	* ruleString: cache charCodes for use in subsequent rules -> slower!?
	* #compile(): rules + subrules into one .js required() at runtime
	* turn string typed handler into smaller handlers using Uglify parser

## Known issues

	* rules with 0 are ignored in arrays (i.e. `addRule([0,123])`)