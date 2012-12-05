0.4.3 / 2012-11-21
==================

* Minor {firstof} subrule tweak


0.4.2 / 2012-11-20
==================

* Added loop optimizations (.ignore(true).continue(-1))
* Added prev property to subrules (accessible from a custom function subrule)
* Fixed out of bound check when grouping rules

0.4.1 / 2012-11-08
==================

* Fixed missing buffertool dependency in package.json
* Better setEncoding behavior
* Added/fixed tests

0.4.0 / 2012-11-06
==================

* Major internal refactoring in defining and running rules and subrules:
  * Easier code maintenance: less subrules objects and cleaner code
  * 20-40% speed up in raw benchmarks
* Buffer support:
  * `Atok#write(data)`
    * `data` (_String_ | _Buffer_): always pass either type. Use `Atok#setEncoding()` when using strings (default=utf-8).
  * `Atok#addRule(pattern...type)`
    * `pattern` (_String_ | _Buffer_): Buffers can be used instead of strings, except for {start,end} and {firstOf} subrules.
* Behaviour changes:
  * Subrules defined as a Number now do not apply the following ones to the matched token. Use another Atok instance to emulate previous behaviour.
  * {firstOf} subrules cannot be in first position. Use addRule('', {firstOf}) instead.
  * Function subrules returning 0 __must__ set continue() properly to avoid potential infinite loops.
  * currentRule property is now a method

0.3.2 / 2012-09-16
==================
* Fix: infinite loop detections

0.3.1 / 2012-07-26
==================

* Fix: corrupted result when `addrule(number|firsOf)` return an empty token

0.3.0 / 2012-07-10
==================

* Cleanups
  * `deleteRuleSet()` -> `removeRuleSet()`
  * `loadProps()` -> `setProps()`: all or a subset of properties are returned
  * `escaped()` -> `escape()`
  * renamed internal properties with a leading _
  * `offsetBuffer` -> `markedOffset`
* Deprecated
  * `saveProps()`: use `getProps()` to retrieve all properties
  * `existsRule()`
  * `getAllRuleSet()`
  * `bytesRead` property
  * `seek()`: use the `offset` property directly
  * `ruleIndex` is now private (`_ruleIndex`) and may not be systematically updated during parsing
  * Boolean subrules in `addRule()`: set the handler/type to `false` to get the same behaviour
  * `addRule(0)`: use the [empty] event (NB. addRule(..., 0, ...)) is still supported.

* Internals
  * Use of Node's StringDecoder for utf-8 encoding
  * Better compliance with Nodejs Stream API:
    * `writable` and `readable` properties are set to false after an error, `end()` and `destroy()`
  * The buffer is always truncated from min(`offset`, `markedOffset`) to try and minimize memory usage
  * .continue(-1).ignore(true).next().addRule(subrule, handler) are optimized with a while()

* Features
  * `getProps()` returns all current properties
  * continue(string|function): resolution automatically performed on `saveRuleSet()` and `write()`. This means that stricter checks are imposed:
    * `continue(+x)` with x>=0 cannot be set on the last rule
    * `continue(-x)` with x<-1 cannot be set on the first rule
  * Infinite loop detection. Cannot detect rule handlers changing the offset property to the one before the rule execution.
  * Added `slice([startIndex[, endIndex]])`: returns a slice of the buffer. NB. the buffer is _not_ altered.
  * Added `groupRule(boolean)`: bind the following rules to the same index (useful for writing helpers and make them behave as a single rule). Groups can be set at any level. Empty or 1 rule groups are ignored.
  * `addRule(function)` is now considered a successful rule
  * If the last argument to `addRule()` is `false`, the rule is ignored
  * Subrule { firstOf: (string|array) } accepts a string as well as an array

0.2.6 / 2012-05-23
==================

* Fix: `addRule(null)` throws an error
* Fix: `addRule([1,2])` returns proper token
* Fix: first rule validation enforced (waits for more data if required, which means rules starting with an array of numbers is equivalent to a rule with the max of those numbers: addRule([1,2]) <=> addRule(2))

0.2.5 / 2012-05-11
==================

* Added `offsetBuffer` property: when set to a positive value, the buffer is not sliced when `write()` ends.
    __Use with caution__ as this can make the buffer continuously grow.
* Added `currentRule` property: name of the current rule set, `getRuleSet()` is deprecated
* Added `getProps()`: return an object containing the requested property values (default=all properties)
* Added second parameter to `continue()`: used when the rule fails (Number, String or Function)
* Added boolean sub rules to `addRule()`: the whole rule is discarded if false, `true` subrule ignored
* `addRule()` can now accept only one parameter (type|handler)
* Added second parameter to `loadRuleSet()` and `next()`: index to be used when loading the rule set
* Added handlers to the [debug] event
  
* Fix: `continue(String|Function)` proper indexes
* Fix: `addRule(0)` can now be invoked many times in a rule set

* Switch to using JSDoc format, documentation automatically generated on build

0.2.4 / 2012-04-20
==================

* `continue()` accepts `null`

0.2.3 / 2012-03-16
==================

* Added [pipe], [listening], [open] and [close] events to the event set
* Added support for array of functions in rule definitions: addRule([fn1, fn2...], ...)
* Fixed wrong array size in sliceArguments()
* Fix: `firstOf` now honors `escaped()`
* Fix: invalid rule index after when using `loadRuleSet()` or `next()`
* Code refactoring
  * automatic masked Rule#test() method
  * `escaped()` subrules

0.2.2 / 2012-02-29
==================

* Fixed rule set name not being reset upon `clearRule()`
* Fixed `clearProps()` not chainable
* Added `break()`: abort a current rule set. Use continue(-1) to resume at the current subrule.
* Added `version` property

0.2.1 / 2012-02-26
==================

* Multiple calls to `debug()` fix

0.2.0 / 2012-02-24
==================

* `split()` removed as it can be achieved with current rules definition and adds little value
* Performance improvements (~50% compared to v0.1.10)
  * [match] event removed as redundant with the [debug] event
  * [loadruleset] and [seek] events moved under the [debug] event
* [debug] event signature: (method name, type, data)
* `debug` option moved to the `debug()` method so debug mode can be turned on and off dynamically
* Added `events` property to Atok

0.1.10 / 2012-02-23
===================

* Code cleanups
* Performance improvements
  * Moved from node's EventEmitter to [ev](https://github.com/pierrec/node-ev)
    * (+) faster by about 20%
    * (-) leverages ev's emit shortcuts
  * `Rule.test()` dynamically set based on rule's static conditions:
    * (+) faster by about 10%
    * (-) much larger code generated by [ekam](https://github.com/pierrec/node-ekam)
* Added benchmarks for every subrule type
* New `split(flag)` property: split token by subrules. No effect if # of subrules is < 3.
* New `debug` option: emits the [debug] event if set to true or trigger the given function for debugging purposes. Note that thanks to dynamic method setting, this has absolutely no impact on performance if not set!

0.1.9 / 2012-02-20
==================

* `continue()` supports string and function input - __must__ perform a `saveRuleSet()` to take effect
* Some refactoring
  * Array.prototype.slice calls
  * Rule index internal fetching

0.1.8 / 2012-02-12
==================

* `clearProps()` reset properties to their default values
* `saveProps()` -> `saveProps(name)` with name=default if not set

0.1.7 / 2012-02-12
==================

* `addRule(rule, 123)` fixed when used with `quiet(true)`
* `continue()` applied when a handler uses `pause()`
* `write()` will continue at the last rule index if the last successful rule was subject to `continue()`
* `next()` and `ignore()` can now be applied to `addRule(0)` - note that `continue()` cannot
* [loadruleset] and [seek] events

0.1.6 / 2012-02-09
==================
* `addRule(123)` now honors `quiet()`

0.1.5 / 2012-02-09
==================

* new property: Atok.ending (Boolean): indicates if `end()` was called
* new events:
  * match (replaces matchEventHandler): rule match (current offset, matched size, matched rule object)
  * empty: empty buffer (ending flag)
    cf. TODO about the performance impact when listeners are attached
* `addRule([rules], 0)` fixed
* `addRule('', handler)` now honors `quiet()`
* handlers triggered in `quiet()` mode gives the non extracted token size as the first argument (actually introduced in the previous release)
* emptyHandler now triggered on a per rule set basis

0.1.4 / 2012-02-06
==================

* New matchEventHandler property (Function): triggered upon a rule match with
    arguments: <offset>, <matched length>, <rule object>
* `continue()` accepts negative input
* `addRule(-1, handler)` triggers [handler] when tokenizer has ended

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