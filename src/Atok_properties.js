  // Public properties
  this.buffer = this._bufferMode ? new Buffer : ''
  this.length = 0
  this.bytesRead = 0
  this.offset = 0
  this.ruleIndex = 0

  // Private properties
  this._resetRuleIndex = false
  this._lastByte = -1

//if(keepRules)
  if (!keepRules) {
//endif
    this.currentRule = null   // Name of the current rule  
    this.emptyHandler = []    // Handler to trigger when the buffer becomes empty
    this.rules = []           // Rules to be checked against
    this.handler = null       // Matched token default handler
    this.saved = {}           // Saved rules
    this.savedProps = {}      // Saved rules properties
//if(keepRules)
  }
//endif
