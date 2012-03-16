function _MaskSetter (method /* , flag1, flag2... */) {
  for (var int = 0, j = 33; --j;) {
    int = int | (arguments[j] ? 1 : 0)
    if (j > 1) int = int << 1
  }
  this[method] = this[ method + "_" + int ]
}

// RULE_GENERATES_TOKEN=0,RULE_TRIMLEFT=0,RULE_TRIMRIGHT=0,DEBUG=0
//var RULE_GENERATES_TOKEN=0,RULE_TRIMLEFT=0,RULE_TRIMRIGHT=0,DEBUG=0
Rule.prototype.test_0 = //include("rule#test.js")
// RULE_GENERATES_TOKEN=1,RULE_TRIMLEFT=0,RULE_TRIMRIGHT=0,DEBUG=0
//var RULE_GENERATES_TOKEN=1,RULE_TRIMLEFT=0,RULE_TRIMRIGHT=0,DEBUG=0
Rule.prototype.test_1 = //include("rule#test.js")
// RULE_GENERATES_TOKEN=0,RULE_TRIMLEFT=1,RULE_TRIMRIGHT=0,DEBUG=0
//var RULE_GENERATES_TOKEN=0,RULE_TRIMLEFT=1,RULE_TRIMRIGHT=0,DEBUG=0
Rule.prototype.test_2 = //include("rule#test.js")
// RULE_GENERATES_TOKEN=1,RULE_TRIMLEFT=1,RULE_TRIMRIGHT=0,DEBUG=0
//var RULE_GENERATES_TOKEN=1,RULE_TRIMLEFT=1,RULE_TRIMRIGHT=0,DEBUG=0
Rule.prototype.test_3 = //include("rule#test.js")
// RULE_GENERATES_TOKEN=0,RULE_TRIMLEFT=0,RULE_TRIMRIGHT=1,DEBUG=0
//var RULE_GENERATES_TOKEN=0,RULE_TRIMLEFT=0,RULE_TRIMRIGHT=1,DEBUG=0
Rule.prototype.test_4 = //include("rule#test.js")
// RULE_GENERATES_TOKEN=1,RULE_TRIMLEFT=0,RULE_TRIMRIGHT=1,DEBUG=0
//var RULE_GENERATES_TOKEN=1,RULE_TRIMLEFT=0,RULE_TRIMRIGHT=1,DEBUG=0
Rule.prototype.test_5 = //include("rule#test.js")
// RULE_GENERATES_TOKEN=0,RULE_TRIMLEFT=1,RULE_TRIMRIGHT=1,DEBUG=0
//var RULE_GENERATES_TOKEN=0,RULE_TRIMLEFT=1,RULE_TRIMRIGHT=1,DEBUG=0
Rule.prototype.test_6 = //include("rule#test.js")
// RULE_GENERATES_TOKEN=1,RULE_TRIMLEFT=1,RULE_TRIMRIGHT=1,DEBUG=0
//var RULE_GENERATES_TOKEN=1,RULE_TRIMLEFT=1,RULE_TRIMRIGHT=1,DEBUG=0
Rule.prototype.test_7 = //include("rule#test.js")
// RULE_GENERATES_TOKEN=0,RULE_TRIMLEFT=0,RULE_TRIMRIGHT=0,DEBUG=1
//var RULE_GENERATES_TOKEN=0,RULE_TRIMLEFT=0,RULE_TRIMRIGHT=0,DEBUG=1
Rule.prototype.test_8 = //include("rule#test.js")
// RULE_GENERATES_TOKEN=1,RULE_TRIMLEFT=0,RULE_TRIMRIGHT=0,DEBUG=1
//var RULE_GENERATES_TOKEN=1,RULE_TRIMLEFT=0,RULE_TRIMRIGHT=0,DEBUG=1
Rule.prototype.test_9 = //include("rule#test.js")
// RULE_GENERATES_TOKEN=0,RULE_TRIMLEFT=1,RULE_TRIMRIGHT=0,DEBUG=1
//var RULE_GENERATES_TOKEN=0,RULE_TRIMLEFT=1,RULE_TRIMRIGHT=0,DEBUG=1
Rule.prototype.test_10 = //include("rule#test.js")
// RULE_GENERATES_TOKEN=1,RULE_TRIMLEFT=1,RULE_TRIMRIGHT=0,DEBUG=1
//var RULE_GENERATES_TOKEN=1,RULE_TRIMLEFT=1,RULE_TRIMRIGHT=0,DEBUG=1
Rule.prototype.test_11 = //include("rule#test.js")
// RULE_GENERATES_TOKEN=0,RULE_TRIMLEFT=0,RULE_TRIMRIGHT=1,DEBUG=1
//var RULE_GENERATES_TOKEN=0,RULE_TRIMLEFT=0,RULE_TRIMRIGHT=1,DEBUG=1
Rule.prototype.test_12 = //include("rule#test.js")
// RULE_GENERATES_TOKEN=1,RULE_TRIMLEFT=0,RULE_TRIMRIGHT=1,DEBUG=1
//var RULE_GENERATES_TOKEN=1,RULE_TRIMLEFT=0,RULE_TRIMRIGHT=1,DEBUG=1
Rule.prototype.test_13 = //include("rule#test.js")
// RULE_GENERATES_TOKEN=0,RULE_TRIMLEFT=1,RULE_TRIMRIGHT=1,DEBUG=1
//var RULE_GENERATES_TOKEN=0,RULE_TRIMLEFT=1,RULE_TRIMRIGHT=1,DEBUG=1
Rule.prototype.test_14 = //include("rule#test.js")
// RULE_GENERATES_TOKEN=1,RULE_TRIMLEFT=1,RULE_TRIMRIGHT=1,DEBUG=1
//var RULE_GENERATES_TOKEN=1,RULE_TRIMLEFT=1,RULE_TRIMRIGHT=1,DEBUG=1
Rule.prototype.test_15 = //include("rule#test.js")
