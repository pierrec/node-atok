# TODO

## API
- Buffer support
- allow token to be split per subrule 2 to n
	i.e. addRule('a', 'b', 'c') on 'a123b456c' emits/calls handler with: ['123','456'] instead of '123b456'
- implement debug tools for rules
	- rule/subrule triggered
	- step by step
- #includeRule(rule name, [rules set]) - use current rule set if none provided
- #includeRuleSet(rule set)

## Features
- additional encodings (currently=utf-8)

## Performance
- ruleString: cache charCodes for use in subsequent rules -> slower!
- use npb to build .js file per property (trimLeft, trimRight)
- #compile(): rules + subrules into one .js required() at runtime
- turn string typed handler into smaller handlers using Uglify parser

## Known issues
none