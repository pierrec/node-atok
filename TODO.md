# TODO

## 0.5.0

* Revisit the way trimLeft() and trimRight() is performed
* Make subrule [...] behave like {firstOf} and remove {firstOf} support
* Compile rule sets to JS code


## 0.4.0

* firstOf optimizations (no slice -> straight compares / regexp on strings)


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

* {start,end} only work as first subrule
* .escape() does not apply to {start,end}

* arrays can only contain the same type (function, number or string)
