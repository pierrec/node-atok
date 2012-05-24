  // Public properties
  this.buffer = this._bufferMode ? new Buffer : ''
  this._stringDecoder = new StringDecoder(this._encoding)
  this.offset = 0
  this.ruleIndex = 0

  // Private properties
  this._resetRuleIndex = false

//if(keepRules)
  if (!keepRules) {
//endif
    this.currentRule = null   // Name of the current rule  
    this._emptyHandler = []    // Handler to trigger when the buffer becomes empty
    this._rules = []           // Rules to be checked against
    this._defaultHandler = null       // Matched token default handler
    this._savedRules = {}           // Saved rules
//if(keepRules)
  }
//endif