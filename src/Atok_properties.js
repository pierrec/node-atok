  // Public properties
  this.buffer = this._bufferMode ? new Buffer : ''
  this.offset = 0
  this.offsetBuffer = -1    // Flag indicating whether the buffer should be kept when write() ends

  // Private properties
  this._ruleIndex = 0
  this._resetRuleIndex = false
  this._stringDecoder = new StringDecoder(this._encoding)
  this._rulesToResolve = false
  this._groupStart = 0
  this._groupEnd = 0

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