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
  this._defaultHandler = typeof handler === 'function' ? handler : null
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
Atok.prototype.escape = function (flag) {
  this._p_escape = flag === true
    ? '\\'
    : flag && flag.length > 0
      ? flag.toString(this._encoding || 'utf8').charAt(0)
      : false
  return this
}
/**
 * Continue the rules flow if rule matches at the specified rule index
 *
 * @param {number|null|undefined} number of rules to skip before continuing
 * @param {number|null|undefined} when the rule fails, number of rules to skip before continuing
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
  else if ( jumpOnFail !== null && !/(number|string|function)/.test(typeof jumpOnFail) )
    this._error( new Error('Atok#continue: Invalid jump (must be an integer/function/string): ' + jumpOnFail) )
  
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
 * Restore properties
 *
 * @param {Object} properties to be loaded
 * @return {Atok}
 * @api public
 */
Atok.prototype.setProps = function (props) {
  var propNames = Object.keys(props || {})

  for (var prop, i = 0, n = propNames.length; i < n; i++) {
    prop = propNames[i]
    if ( this.hasOwnProperty('_p_' + prop) )
      switch (prop) {
        // Special case: continue has 2 properties
        case 'continue':
          this._p_continue = props[ prop ][0]
          this._p_continueOnFail = props[ prop ][1]
        break
        // Special case: next has 2 properties
        case 'next':
          this._p_next = props[ prop ][0]
          this._p_nextIndex = props[ prop ][1]
        break
        default:
          this[ '_p_' + prop ] = props[ prop ]
      }
  }

  return this
}
/**
 * Reset properties to their default values
 *
 * @return {Atok}
 * @api public
 */
Atok.prototype.clearProps = function () {
//include("Atok_rule_properties.js")

  return this
}
/**
 * Reset properties to their default values
 *
 * @return {Object}
 * @api public
 */
Atok.prototype.getProps = function () {
  // Empty object with no prototype
  var props = Object.create(null)
  var propNames = arguments.length > 0
        ? sliceArguments(arguments, 0)
        : this._defaultProps

  for (var prop, i = 0, num = propNames.length; i < num; i++) {
    prop = propNames[i]
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
