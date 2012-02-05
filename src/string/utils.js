function toCharCodes (v) {
  var res
  switch (typeof v) {
    case 'number':
      return v
    case 'string':
      if (v.length == 0)
        throw new Error('SubRule: Empty value')
      
      res = stringToCharCodes( [v] )
      break
    default:
      if ( !isArray(v) )
        throw new Error('SubRule: Invalid value')
      
      res = stringToCharCodes( v )
    }
  return res.length > 1 ? res: res[0]
}

function stringToCharCodes (arr, forceArray) {
  return arr.map(function (s) {
    return s.length == 1
      ? ( forceArray ? [ s.charCodeAt(0) ] : s.charCodeAt(0) )
      : s.split('').map(function (c) { return c.charCodeAt(0) })
    })
}