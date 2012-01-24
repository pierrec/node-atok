- API:
	- "use strict"?
	- Buffer support
	- allow token to be split per subrule 2 to n
		i.e. addRule('a', 'b', 'c') on 'a123b456c' calls handler with: ['123','456'] instead of '123b456'
	- implement debug tools for rules
		- rule/subrule triggered
		- step by step
	- implement #includeRule
	- implement #includeRuleSet

- Performance:
	- ruleString: cache charCodes for use in subsequent rules
	- turn subrules into discrete objects
	- use npb to build .js file per property (trimLeft, trimRight)
	- #compile(): rules + subrules into one .js required() at runtime
	- turn string typed handler into smaller handlers using Uglify parser