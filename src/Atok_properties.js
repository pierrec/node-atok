  // Public properties
  this.buffer = null
  this.length = 0
  this.offset = 0
  this.markedOffset = -1    // Flag indicating whether the buffer should be kept when write() ends

  // Private properties
  this._firstRule = null        // Initial rule to be triggered
  this._resetRule = false       // Rule set was changed
  this._stringDecoder = new StringDecoder(this._encoding)
  this._rulesToResolve = false  // Rules need to be resolved (continue() prop)
  this._rulesToLink = false     // Rules need to be relinked (after a rule set change)
  this._group = -1
  this._groupStart = 0
  this._groupEnd = 0
  this._groupStartPrev = []

//if(keepRules)
  if (!keepRules) {
//endif
    // this.currentRule = { get: function (ruleSet) { return this._firstRule.currentRule }, set: function () { throw new Error('Atok: Cannot set currentRule') } }       // Name of the current rule
    this.currentRule = null       // Name of the current rule
    this._rules = []              // Rules to be checked against
    this._defaultHandler = null   // Matched token default handler
    this._savedRules = {}         // Saved rules
//if(keepRules)
  }
//endif