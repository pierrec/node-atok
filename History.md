0.1.4 / 2012-02-05
==================


0.1.3 / 2012-02-05
==================

  * When `quiet()`, the token is set to the would be token length
  * `seek()` decreases bytes on negative seek
  * Added `existsRule()`
  * Added `deleteRuleSet()`
  * Added `getRuleSet()`
  * Added `getAllRuleSet()`

0.1.2 / 2012-02-03
==================

  * Changed `length()` to be a property
  * Added `addRuleFirst()`
  * Added `continue()`
  * If any remaining data, `end()` signature set to (token, -1, ruleSetName)
  * `setEncoding()` default value is UTF-8, utf-8 and utf8 are also accepted
  * `removeRule()` fixed processing Function

0.1.1 / 2012-01-31
==================

  * Fixed utf8 handling in `write()`
  * Fixed return flag in `write()`, resolving `pipe()` freeze

0.1.0 / 2012-01-30
==================

  * First release