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
  if (arguments.length === 0) {
    this._p_continue = null
    return this
  }
  if (typeof jump !== 'number')
    this._error( new Error('Tokenizer#continue: Invalid jump (must be an integer): ' + jump) )
  
  this._p_continue = jump
  return this
}
/** chainable
 * Tokenizer#saveProps()
 *
 * Save all properties
**/
Tknzr.prototype.saveProps = function () {
  this.savedProps = {
    ignore: this._p_ignore
  , quiet: this._p_quiet
  , escape: this._p_escape
  , trimLeft: this._p_trimLeft
  , trimRight: this._p_trimRight
  , next: this._p_next
  , continue: this._p_continue
  }
  
  return this
}
/** chainable
 * Tokenizer#loadProps(prop[, prop])
 * - prop (String): name of the property
 *
 * Restore saved proterties
**/
Tknzr.prototype.loadProps = function () {
  var p = this.savedProps

  this._p_ignore = p.ignore
  this._p_quiet = p.quiet
  this._p_escape = p.escape
  this._p_trimLeft = p.trimLeft
  this._p_trimRight = p.trimRight
  this._p_next = p.next
  this._p_continue = p.continue

  return this
}