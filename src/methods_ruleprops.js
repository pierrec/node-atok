/** chainable
 * Tokenizer#setDefaultHandler(handler)
 * - handler (Function): named rules handler
 *
 * Set the default handler.
 * Triggered on all subsequently defined rules if the handler is not supplied
**/
Tknzr.prototype.setDefaultHandler = function (handler) {
  this.handler = typeof handler === 'function' ? handler : null
  return this
}
/** chainable
 * Tokenizer#next(ruleSet)
 * - ruleSet (String): name of the rule set to load if rule successful
 *
 * Skip matched data silently for all subsequent rules
**/
Tknzr.prototype.next = function (ruleSet) {
  this._p_next = ruleSet
  return this
}
/** chainable
 * Tokenizer#ignore(flag)
 * - flag (Boolean): flag
 *
 * Skip matched data silently for all subsequent rules
**/
Tknzr.prototype.ignore = function (flag) {
  this._p_ignore = (flag === true)
  return this
}
/** chainable
 * Tokenizer#quiet(flag)
 * - flag (Boolean): flag
 *
 * Do not supply matched data to the handler for all subsequent rules.
 * This is used when the token data does not matter but a handler 
 * still needs to be called. Faster than standard handler call.
**/
Tknzr.prototype.quiet = function (flag) {
  this._p_quiet = (flag === true)
  return this
}
/** chainable
 * Tokenizer#trimLeft(flag)
 * - flag (Boolean): flag
 *
 * Remove the left matched pattern for all subsequent rules
**/
Tknzr.prototype.trimLeft = function (flag) {
  this._p_trimLeft = (flag === true)
  return this
}
/** chainable
 * Tokenizer#trimRight(flag)
 * - flag (Boolean): flag
 *
 * Remove the right matched pattern for all subsequent rules
 * If only 1 pattern, it is ignored
**/
Tknzr.prototype.trimRight = function (flag) {
  this._p_trimRight = (flag === true)
  return this
}
/** chainable
 * Tokenizer#trim(flag)
 * - flag (Boolean): flag
 *
 * Remove the left and right matched patterns for all subsequent rules
**/
Tknzr.prototype.trim = function (flag) {
  return this.trimLeft(flag).trimRight(flag)
}
/** chainable
 * Tokenizer#escaped(flag)
 * - flag (Boolean|String): flag
 *
 * Do not remove the left and right matched patterns for all subsequent rules
 * The default escape character is \, can be changed by specifying it instead of a Boolean
**/
Tknzr.prototype.escaped = function (flag) {
  this._p_escape = typeof flag === 'string' && flag.length > 0
    ? flag[0]
    : flag === true
      ? '\\'
      : false
  return this
}
/** chainable
 * Tokenizer#continue(jump)
 * - jump (Integer): number of rules to skip before continuing
 *
 * Continue the rules flow if rule matches at the specified rule index
**/
Tknzr.prototype.continue = function (jump) {
  if (arguments.length === 0 || jump === null) {
    this._p_continue = null
    return this
  }
  
  if ( !/(number|string|function)/.test(typeof jump) )
    this._error( new Error('Tokenizer#continue: Invalid jump (must be an integer/function/string): ' + jump) )
  
  this._p_continue = jump
  return this
}
/** chainable
 * Tokenizer#break()
 *
 * Abort a current rule set. Use continue(-1) to resume at the current subrule.
**/
Tknzr.prototype.break = function (flag) {
  this._p_break = (flag === true)
  return this
}
/** chainable
 * Tokenizer#saveProps(name)
 * - name (String): saved properties id
 *
 * Save all properties
**/
Tknzr.prototype.saveProps = function (name) {
  this.savedProps[name || 'default'] = {
    ignore: this._p_ignore
  , quiet: this._p_quiet
  , escape: this._p_escape
  , trimLeft: this._p_trimLeft
  , trimRight: this._p_trimRight
  , next: this._p_next
  , continue: this._p_continue
  , break: this._p_break
  }
  
  return this
}
/** chainable
 * Tokenizer#loadProps(name)
 * - name (String): saved properties id
 *
 * Restore saved proterties
**/
Tknzr.prototype.loadProps = function (name) {
  name = name || 'default'
  var p = this.savedProps[name]
  delete this.savedProps[name]

  this._p_ignore = p.ignore
  this._p_quiet = p.quiet
  this._p_escape = p.escape
  this._p_trimLeft = p.trimLeft
  this._p_trimRight = p.trimRight
  this._p_next = p.next
  this._p_continue = p.continue
  this._p_break = p.break

  return this
}
/** chainable
 * Tokenizer#clearProps()
 *
 * Reset properties to their default values
**/
Tknzr.prototype.clearProps = function () {
  this._p_ignore = false     // Get the token size and skip
  this._p_quiet = false      // Get the token size and call the handler with no data
  this._p_escape = false     // Pattern must not be escaped
  this._p_trimLeft = true    // Remove the left pattern from the token
  this._p_trimRight = true   // Remove the right pattern from the token
  this._p_next = null        // Next rule to load
  this._p_continue = null    // Next rule index to load
  this._p_break = false      // Abort current rule set

  return this
}
