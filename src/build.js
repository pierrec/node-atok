var path = require('path')
var exec = require('child_process').exec

var fstream = require('fstream')

build({
  "input": {
    "include": "**/*.js",
    "exclude": "build.json build.js"
  },
  "output": {
    "path": "../lib",
    "mode": "0755",
    "clean": true
  }
}, function (err, files) {
  if (err) return console.error(err)

  function saveFile (filename, data, callback) {
    fstream
      .Writer({
        path: filename
      })
      .on('error', callback)
      .on('close', callback)
      .end(data)
  }

  // Build the documentation
  files
    .filter(function (file) {
      // Only document the main file
      return !/rule/.test(file)
    })
    .forEach(function (file) {
      var filename = path.basename(file, '.js')
      var outdir = path.join( __dirname, '..', 'doc')
      var packData = require( path.join( __dirname, '..', 'package.json') )

      exec('dox <' + file, function (err, stdout, stderr) {
        if (err) return console.error(err)

        var tmpfile = path.join( outdir, filename + '.json' )

        saveFile(tmpfile, stdout, function (err) {
          if (err) return console.error(err)

          exec(
            'dox-template -n "' + packData.name + '" -r ' + packData.version + ' <' + tmpfile
          , function (err, stdout, stderr) {
              if (err) return console.error(err, stderr)

              saveFile(
                path.join( outdir, filename + '.html' )
              , stdout
              , function (err) {
                  if (err) return console.error(err)
                }
              )
            }
          )
        })
      })
    })
})
