/**
 * Convert a value to an array of char codes
 *
 * @param {number|string|Array} value to convert
 * @return {Array|number} char code(s)
 * @api private
 */
function toCharCodes (v) {
  var res

  switch (typeof v) {
    case 'number':
      return v
    case 'string':
      if (v.length === 0)
        throw new Error('SubRule: Empty value')
      
      res = stringToCharCodes( [v] )
      break
    default:
      if ( !isArray(v) )
        throw new Error('SubRule: Invalid value (not number/string/array)')
      
      res = stringToCharCodes( v )
  }

  return res.length > 1 ? res: res[0]
}

/**
 * Convert an array of strings into an array of char codes
 *
 * @param {Array} array of strings to convert
 * @return {Array|number} char code(s)
 * @api private
 */
function stringToCharCodes (arr, forceArray) {
  return arr.map(function (s) {
    return s.length > 1
      ? s.split('').map(function (c) { return c.charCodeAt(0) })
      : forceArray
        ? [ s.charCodeAt(0) ]
        : s.charCodeAt(0)
    })
}

/**
 * Check items of a string array are of the same size and return it
 *
 * @param {Array} array of strings
 * @return {number} -1 if not the same sizer or string size
 * @api private
 */
function getArrayItemsSize (arr) {
  var n = arr.length

  if (n === 0) return -1

  var size = arr[0].length
    , i = 0

  while ( ++i < n )
    if ( arr[i].length !== size ) return -1

  return size
}
