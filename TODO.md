# TODO

## 0.4.0

* Subrules no longer extract tokens (only a number is returned) -> simplify code and allow Buffer support
* single subrule optimization: merge subrule object with rule object
* Buffer support
* Returns Buffer instances instead of strings unless setEncoding() was used (Stream compliance)
* subrules linked execution


## 0.3.1

* `resolveRuleSet()`: merge rules that use next(). This should give a slight performance increase.


## Documentation

* Rewrite: API / Methods / Members


## Performance

* use for() loop in Atok#debug() and Rule#setDebug() ?

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