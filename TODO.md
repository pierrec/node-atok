# TODO

* rename internal properties with a leading _
* rename escaped() -> escape()?

## API

* better utf-8 support - use a decoding stream upfront of atok? (also applies to other encodings)
* Buffer support?

## Features


## Documentation

* Rewrite: API / Methods / Members

## Performance

* 20-25% drop when using the published module vs direct local access... with the exact same code
* subrules linked execution
* handler signature: token idx, type => rule object ?
* ruleString: cache charCodes for use in subsequent rules -> slower!?
* #compile(): rules + subrules into one .js required() at runtime
* turn string typed handler into smaller handlers using Uglify parser

## Known issues

* function rules cannot return a token
	wrong -> set this.token = true and return a String
* arrays can only contain the same type (function, number or string)
* the following need major refactoring for proper implementation (linked subrules)
	* rules with 0 are ignored in arrays (i.e. `addRule([0,123])`)
	* addRule(123, 0, handler) will trigger the handler even if end of buffer not reached