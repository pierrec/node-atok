  // Public properties
  this.buffer = this._bufferMode ? new Buffer : ''
  this.length = 0
  this.offset = 0
  this.markedOffset = -1    // Flag indicating whether the buffer should be kept when write() ends

  // Private properties
  this._tokenizing = false
  this._ruleIndex = 0
  this._resetRuleIndex = false
  this._stringDecoder = new StringDecoder(this._encoding)
  this._rulesToResolve = false
  this._group = -1
  this._groupStart = 0
  this._groupEnd = 0
  this._groupStartPrev = []

//if(keepRules)
  if (!keepRules) {
//endif
    this.currentRule = null       // Name of the current rule
    this._rules = []              // Rules to be checked against
    this._defaultHandler = null   // Matched token default handler
    this._savedRules = {}         // Saved rules
//if(keepRules)
  }
//endif