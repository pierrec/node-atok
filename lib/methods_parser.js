/**
 * Tokenizer#createParser(file, options, optionsParser)
 * - file (String): file to read the parser from(.js extension is optional)
 * - options (Object): tokenizer options
 * - optionsParser (String | Array): list of named arguments supplied to the parser
 *
 * Return a parser class (Function) based on the input file.
 * The following variables are made available to the parser js:
 * - atok {Object}: atok tokenizer instanciated with options
**/
Tknzr.createParser = function (file, parserOptions, atokOptions) {
  var filename = path.resolve( file.slice(-3) === '.js' ? file : file + '.js' )

  var content = []
  content.push(
    'exports = Parser'
  , 'function Parser (' + (parserOptions || '') + ') {'
  , 'if (!(this instanceof Parser)) {'
  , 'return new Parser(' + (parserOptions || '') + ') }'
  , 'Stream.call(this)'
  , 'this.readable = true'
  , 'this.writable = true'
  , 'var atok = new Atok(' + (atokOptions ? JSON.stringify(atokOptions): '') + ')'
  , 'this.atok = atok'
  , '\n'
  )
  try {
    content.push( fs.readFileSync(filename).toString() )
  } catch (err) {
    this.prototype._error(err)
    return null
  }
  content.push(
    '}'
  , 'inherits(Parser, Stream)'
  )

  // Expose standard Node globals + atok specifics
  var exports = {}
  var sandbox = {
    exports: exports
  , module: { exports: exports }
  , require: module.require // Use require() from the caller!
  , __filename: filename
  , __dirname: path.dirname(filename)
  // Custom exposed globals
  , Atok: Tknzr
  , Stream: Stream
  , inherits: inherits
  }
  sandbox.global = sandbox
  // Make the global properties available to the parser
  merge(sandbox, global)

  // Build the parser constructor
  // On any error, the line count will be off by 1
  vm.createScript(content.join(';'), filename)
    .runInNewContext(sandbox)

  var Parser = sandbox.exports

  // Apply the parser stream methods to the tokenizer
  Parser.prototype.pause = function () {
    this.atok.pause()
    return this
  }
  Parser.prototype.resume = function () {
    this.atok.resume()
    return this
  }
  Parser.prototype.write = function (data) {
    return this.atok.write(data)
  }
  Parser.prototype.end = function (data) {
    return this.atok.end(data)
  }
  Parser.prototype.destroy = noOp

  return Parser
}