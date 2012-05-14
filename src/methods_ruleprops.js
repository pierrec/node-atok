/**
 * Set the default handler.
 * Triggered on all subsequently defined rules if the handler is not supplied
 *
 * @param {function(string, number, string|null)} rules handler (it is better to name it for debugging)
 *   handler is called with (token, index, type)
 * @return {Atok}
 * @api public
 */
Atok.prototype.setDefaultHandler = function (handler) {
  this.handler = typeof handler === 'function' ? handler : null
  return this
}
/**
 * Skip matched data silently for all subsequent rules
 *
 * @param {string} name of the rule set to load if rule successful
 * @param {number} index to start at
 * @return {Atok}
 * @api public
 */
Atok.prototype.next = function (ruleSet, index) {
  this._p_next = typeof ruleSet === 'string' ? ruleSet : null
  this._p_nextIndex = typeof index === 'number' ? index : 0
  return this
}
/**
 * Skip matched data silently for all subsequent rules
 *
 * @param {boolean|undefined} flag
 * @return {Atok}
 * @api public
 */
Atok.prototype.ignore = function (flag) {
  this._p_ignore = (flag === true)
  return this
}
/**
 * Do not supply matched data to the handler for all subsequent rules.
 * This is used when the token data does not matter but a handler 
 * still needs to be called. Faster than standard handler call.
 *
 * @param {boolean|undefined} flag
 * @return {Atok}
 * @api public
 */
Atok.prototype.quiet = function (flag) {
  this._p_quiet = (flag === true)
  return this
}
/**
 * Remove the left matched pattern for all subsequent rules
 *
 * @param {boolean|undefined} flag
 * @return {Atok}
 * @api public
 */
Atok.prototype.trimLeft = function (flag) {
  this._p_trimLeft = (flag === true)
  return this
}
/**
 * Remove the right matched pattern for all subsequent rules
 * If only 1 pattern, it is ignored
 *
 * @param {boolean|undefined} flag
 * @return {Atok}
 * @api public
 */
Atok.prototype.trimRight = function (flag) {
  this._p_trimRight = (flag === true)
  return this
}
/**
 * Remove the left and right matched patterns for all subsequent rules
 *
 * @param {boolean|undefined} flag
 * @return {Atok}
 * @api public
 */
Atok.prototype.trim = function (flag) {
  return this.trimLeft(flag).trimRight(flag)
}
/**
 * Do not remove the left and right matched patterns for all subsequent rules
 * The default escape character is \, can be changed by specifying it instead of a Boolean
 *
 * @param {boolean|undefined} flag
 * @return {Atok}
 * @api public
 */
Atok.prototype.escaped = function (flag) {
  this._p_escape = typeof flag === 'string' && flag.length > 0
    ? flag[0]
    : flag === true
      ? '\\'
      : false
  return this
}
/**
 * Continue the rules flow if rule matches at the specified rule index
 *
 * @param {number|null|undefined} number of rules to skip before continuing
 * @param {number|null|undefined} when the rule fails, number of rules to skip before continuing (must be positive)
 * @return {Atok}
 * @api public
 */
Atok.prototype.continue = function (jump, jumpOnFail) {
  if (arguments.length === 0) {
    this._p_continue = null
    this._p_continueOnFail = null

    return this
  }

  if ( jump !== null && !/(number|string|function)/.test(typeof jump) )
    this._error( new Error('Atok#continue: Invalid jump (must be an integer/function/string): ' + jump) )
  
  if (arguments.length === 1)
    jumpOnFail = null
  else if (
        jumpOnFail !== null
    && (    !/(number|string|function)/.test(typeof jumpOnFail)
        ||  (typeof jumpOnFail === 'number' && jumpOnFail < 0)
       )
    )
      this._error( new Error('Atok#continue: Invalid jump (must be a positive integer/function/string): ' + jumpOnFail) )
  
  this._p_continue = jump
  this._p_continueOnFail = jumpOnFail

  return this
}
/**
 * Abort a current rule set. Use continue(-1) to resume at the current subrule.
 *
 * @return {Atok}
 * @api public
 */
Atok.prototype.break = function (flag) {
  this._p_break = (flag === true)
  return this
}
/**
 * Save all properties
 *
 * @param {string} saved properties id
 * @return {Atok}
 * @api public
 */
Atok.prototype.saveProps = function (name) {
  this.savedProps[name || 'default'] = this.getProps()
  
  return this
}
/**
 * Restore saved proterties
 *
 * @param {string} saved properties id
 * @return {Atok}
 * @api public
 */
Atok.prototype.loadProps = function (name) {
  name = name || 'default'
  var p = this.savedProps[name]
  delete this.savedProps[name]

  this._p_ignore = p.ignore
  this._p_quiet = p.quiet
  this._p_escape = p.escape
  this._p_trimLeft = p.trimLeft
  this._p_trimRight = p.trimRight
  this._p_next = p.next[0]
  this._p_nextIndex = p.next[1]
  this._p_continue = p.continue[0]
  this._p_continueOnFail = p.continue[1]
  this._p_break = p.break

  return this
}
/**
 * Reset properties to their default values
 *
 * @return {Atok}
 * @api public
 */
Atok.prototype.clearProps = function () {
  this._p_ignore = false        // Get the token size and skip
  this._p_quiet = false         // Get the token size and call the handler with no data
  this._p_escape = false        // Pattern must not be escaped
  this._p_trimLeft = true       // Remove the left pattern from the token
  this._p_trimRight = true      // Remove the right pattern from the token
  this._p_next = null           // Next rule to load
  this._p_nextIndex = 0         // Index for the next rule to load
  this._p_continue = null       // Next rule index to load
  this._p_continueOnFail = null // Next rule index to load when rule fails
  this._p_break = false         // Abort current rule set

  return this
}
/**
 * Reset properties to their default values
 *
 * @return {Atok}
 * @api public
 */
Atok.prototype.getProps = function () {
  var props = {}

  // Default properties
  var defaultProps = Object.keys(this)
    .filter(function (prop) {
      return prop.substr(0, 3) === '_p_' && !/_p_(continueOnFail|nextIndex)/.test(prop)
    })
    .map(function (prop) {
      return prop.substr(3)
    })

  var propNames = arguments.length > 0 ? sliceArguments(arguments, 0) : defaultProps

  for (var prop, i = 0, num = propNames.length; i < num; i++) {
    prop = propNames[i] === 'escaped' ? 'escape' : propNames[i]
    if ( this.hasOwnProperty('_p_' + prop) )
      switch (prop) {
        // Special case: continue has 2 properties
        case 'continue':
          props[ prop ] = [ this._p_continue, this._p_continueOnFail ]
        break
        // Special case: next has 2 properties
        case 'next':
          props[ prop ] = [ this._p_next, this._p_nextIndex ]
        break
        default:
          props[ prop ] = this[ '_p_' + prop ]
      }
        
  }

  return props
}
