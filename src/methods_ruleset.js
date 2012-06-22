/**
 * Add a rule as the first one
 *
 * @param {string|number|function()} name of the rule to be added first
 * @param {...string|number|function()} rule item
 * @param {string|number|function()} rule type
 * @return {Atok}
 * @api public
 * @see Atok#addRule
 */
Atok.prototype.addRuleFirst = function (rule, /*rule, ... */ type) {
  this.addRule.apply( this, sliceArguments(arguments, 0) )
  this._rules.unshift( this._rules.pop() )

  return this
}
/**
 * Get the index of a rule by id
 *
 * @param {string|number|function()} rule type
 * @return {number}
 * @api private
 */
Atok.prototype._getRuleIndex = function (id) {
  for (var rules = this._rules, i = 0, n = rules.length; i < n; i++)
    if (rules[i].id === id) return i
  
  return -1
}
/**
 * Add a rule before an existing one
 *
 * @param {string|number|function()} name of the rule to add before
 * @param {...string|number|function()} rule item
 * @param {string|number|function()} rule type
 * @return {Atok}
 * @api public
 * @see Atok#addRule
 */
Atok.prototype.addRuleBefore = function (existingRule, rule, /*rule, ... */ type) {
  var i = this._getRuleIndex(existingRule)

  if ( i < 0 )
    return this._error( new Error('Atok#addRuleBefore: rule ' + existingRule + ' does not exist') )

  this.addRule.apply( this, sliceArguments(arguments, 1) )
  this._rules.splice( i, 0, this._rules.pop() )

  return this
}
/**
 * Add a rule after an existing one
 *
 * @param {string|number|function()} name of the rule to add after
 * @param {...string|number|function()} rule item
 * @param {string|number|function()} rule type
 * @return {Atok}
 * @api public
 * @see Atok#addRule
 */
Atok.prototype.addRuleAfter = function (existingRule, rule, /*rule, ... */ type) {
  var i = this._getRuleIndex(existingRule)

  if ( i < 0 )
    return this._error( new Error('Atok#addRuleAfter: rule ' + existingRule + ' does not exist') )

  this.addRule.apply( this, sliceArguments(arguments, 1) )
  this._rules.splice( i + 1, 0, this._rules.pop() )

  return this
}
/**
 * Add a rule
 *
 * @param {...string|number|function()} match at current buffer position (String: expect string, Integer: expect n characters, Array: expect one of the items). If not needed, use ''
 * @param {false|string|number|function()} rule name/id (if no default handler set, emit a data event) or handler (executed when all matches are valid). If false, the rule is ignored.
 * @return {Atok}
 * @api public
 */
Atok.prototype.addRule = function (/*rule1, rule2, ... type|handler*/) {
  var args = sliceArguments(arguments, 0)

  if (args.length < 1)
    return this._error( new Error('Atok#addRule: Missing arguments (/*rule1, rule2 ...*/ type|handler)') )
  
  var last = args.pop()

  // Ignore the rule if the handler/type is false
  if (last === false) return this

  var first = args[0]
  var type = null
    , handler = this._defaultHandler

  switch ( typeof(last) ) {
    case 'function':
      handler = last
      break
    case 'number':
    case 'string':
      type = last
      break
    default:
      this._error( new Error('Atok#addRule: invalid type/handler, must be Number/String/Function') )
      return this
  }

  this._checkResolveRules()

  if ( first === 0 )
    this._error( new Error('Atok#addRule: invalid first subrule, must be > 0') )
  else
    this._rules.push(
      RuleString(
        args
      , type
      , handler
      , this
      )
    )

  return this
}
/**
 * Remove a rule (first instance only)
 *
 * @param {string} name of the rule to be removed
 * @return {Atok}
 * @api public
 */
Atok.prototype.removeRule = function (/* name ... */) {
  if (arguments.length === 0) return this
  
  for (var idx, i = 0, n = arguments.length; i < n; i++) {
    idx = this._getRuleIndex(arguments[i])
    if (idx >= 0) {
      this._rules = this._rules.slice()
      this._rules.splice(idx, 1)
    }
  }
  this._checkResolveRules()

  return this
}
/**
 * Resolve rules righ away or delay it
 *
 * @api private
 */
Atok.prototype._checkResolveRules = function () {
  // Rules have been modified, force a resolve when required
  if (this._tokenizing)
    this._resolveRules()
  else
    this._rulesToResolve = true
}
/**
 * Remove all rules
 *
 * @return {Atok}
 * @api public
 */
Atok.prototype.clearRule = function () {
  this.clearProps()
  this._rules = []
  this._defaultHandler = null
  this.currentRule = null
  this._rulesToResolve = false

  return this
}
/**
 * Save all rules
 *
 * @param {string} name of the rule set
 * @return {Atok}
 * @api public
 */
Atok.prototype.saveRuleSet = function (name) {
  if (arguments.length === 0 || name === null)
    return this._error( new Error('Atok#saveRuleSet: invalid rule name supplied') )
  

  this._savedRules[name] = {
    rules: this._rules.slice() // Make sure to make a copy of the list
  }
  this.currentRule = name

  // Resolve and check continues
  this._resolveRules(name)

  return this
}
/**
 * Load a rule set
 *
 * @param {string} name of the rule set
 * @param {number} index to start at
 * @return {Atok}
 * @api public
 */
Atok.prototype.loadRuleSet = function (name, index) {
  var ruleSet = this._savedRules[name]
  if (!ruleSet)
    return this._error( new Error('Atok#loadRuleSet: Rule set ' + name + ' not found') )

  this.currentRule = name
  this._rules = ruleSet.rules
  this._rulesToResolve = false
  // Set the rule index
  this._ruleIndex = typeof index === 'number' ? index : 0
  this._resetRuleIndex = true

  return this
}
/**
 * Delete a rule set
 *
 * @param {string} name of the rule set
 * @return {Atok}
 * @api public
 */
Atok.prototype.removeRuleSet = function (name) {
  delete this._savedRules[name]
  // Make sure no reference to the rule set exists
  if (this.currentRule === name) this.currentRule = null

  return this
}
/**
 * Resolve a rule or all of them if none specified:
 * - translate non number continue() to numbers
 * - check continue() stay within bounds
 * - adjust the continue() jumps based on groups
 *
 * Also detects infinite loops
 *
 * @param {string} name of the rule set (optional)
 * @api private
 */
Atok.prototype._resolveRules = function (name) {
  var self = this
  // Check and set the continue values
  var rules = name ? this._savedRules[name].rules : ( name = this.currentRule, this._rules )
  var groupStartPrev = this._groupStartPrev

  function getErrorData (i) {
    return ( name ? '@' + name : ' ' )
      + (arguments.length > 0
          ? '[' + i + ']'
          : ''
        )
  }

  // Perform various checks on a continue type property
  function resolveId (prop) {
    if (rule[prop] === null || typeof rule[prop] === 'number') return

    // Resolve the property to an index
    var j = self._getRuleIndex(rule.id)
    if (j < 0)
      self._error( new Error('Atok#_resolveRules: ' + prop + '() value not found: ' + rule.id) )
      
    rule[prop] = i - j
  }

  // prop: continue type property
  function checkContinue (prop) {
    if (typeof rule[prop] !== 'number') return

    // incr: 1 or -1 (positive/negative continue)
    // offset: 0 or 1 (positive/negative continue)
    function setContinue (incr, offset) {
      // j = current index to be checked
      // count = number of indexes to check
      for (
        var j = i + incr, count = 0, m = Math.abs(cont + offset)
      ; count < m
      ; j += incr, count++
      ) {
        // Scan all rules from the current one to the target one
        var _rule = rules[j]

        // Jumping to the last rule is valid
        if (j === n && count === m - 1) return

        if (j < 0 || j > n)
          self._error( new Error('Atok#_resolveRules: ' + prop + '() value out of bounds: ' + cont + getErrorData(i)) )

        // Only process rules bound to a group below the current one
        // Or at the same level but different
        if (_rule.group > rule.group
        || (_rule.group === rule.group && _rule.groupStart !== rule.groupStart)
        ) {
          // Get to the right group
          while (_rule.group > rule.group + 1) {
            j = incr > 0 ? _rule.groupEnd + 1 : _rule.groupStart - 1
            // Jump to the end of the rules is ignored
            if (j > n) {
              cont = null
              return
            }

            _rule = rules[j]
          }
          j = incr > 0 ? _rule.groupEnd : _rule.groupStart
          cont += incr * (_rule.groupEnd - _rule.groupStart)
        }
      }
    }

    // Use the backup value
    var cont = rule.backup[prop]

    // continue(0) and continue(-1) do not need any update
    if (cont > 0)
      // Positive jump
      setContinue(1, 0)
    else if (cont < -1)
      // Negative jump
      setContinue(-1, 1)
    
    // Check the continue boundaries
    var j = i + cont + 1
    // Cannot jump to a rule before the first one or beyond the last one.
    // NB. jumping to a rule right after the last one is accepted since
    // it will simply stop the parsing
    if (j < 0 || j > n)
      self._error( new Error('Atok#_resolveRules: ' + prop + '() value out of bounds: ' + cont + getErrorData(i)) )

    // Save the next rule index
    rule[prop] = cont
  }

  // Process all rules
  // Adjust continue jumps according to groups
  for (var i = 0, n = rules.length; i < n; i++) {
    var rule = rules[i]
    // Check each rule continue property
    checkContinue('continue')
    checkContinue('continueOnFail')

    // Set values for null
    if (rule.continue === null)
      // Go to the start of the rule set
      rule.continue = -(i + 1)

    if (rule.continueOnFail === null)
      // Go to the next rule
      rule.continueOnFail = 0

    // Check the continue property
    resolveId('continue')

    // Check the continueOnFail property
    resolveId('continueOnFail')

    // Check the group is terminated
    if (rule.group >= 0 && rule.groupEnd === 0)
      this._error( new Error('Atok#_resolveRules: non terminated group starting at index ' + rule.groupStart ) )

    // An infinite loop is created when a 0 length rule points
    // to another 0 length one
    if (rule.length === 0) {
      var nextRule = rule.continue === null
        ? rules[0]
        : rules[ i + 1 + rule.continue ]

      if (nextRule && nextRule.length === 0)
        this._error( new Error('Atok#_resolveRules: infinite loop' + getErrorData(i)) )
    }
  }

  // Resolution successfully completed
  this._rulesToResolve = false
}
/**
 * Bind rules to the same index
 *
 * @param {Boolean} toggle grouping on/off
 * @return {Atok}
 * @api public
 */
Atok.prototype.groupRule = function (flag) {
  var rules = this._rules

  if (flag) {
    this._group++
    this._groupStartPrev.push(this._groupStart)
    this._groupStart = rules.length

    return this
  }

  // Ignore invalid groupRule()
  if (this._group < 0) return this
  
  // 1 or 0 rule within the group, ignored it
  if (rules.length - this._groupStart < 2) {
    for (var i = this._groupStart, n = rules.length; i < n; i++) {
      rules[i].group = -1
      rules[i].groupStart = 0
      rules[i].groupEnd = 0
    }
  } else {
    // Set the last index of the group to all rules belonging to the current group
    for (var i = this._groupStart, n = rules.length; i < n; i++)
      if (rules[i].group === this._group)
        rules[i].groupEnd = n - 1
  }

  this._group--
  this._groupStart = this._groupStartPrev.pop() || 0
  this._groupEnd = 0

  return this
}
