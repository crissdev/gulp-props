'use strict'

const props = require('./')
const File = require('vinyl')
const es = require('event-stream')
const assert = require('assert')
const Readable = require('stream').Readable

describe('gulp-props', function () {
  describe('in buffer mode', function () {
    const _createFile = function (contents, filename) {
      if (Array.isArray(contents)) {
        contents = contents.join('\n')
      }

      contents = Buffer.from(contents)

      return new File({
        cwd: './',
        base: './test/',
        path: './test/' + (filename || 'mock.properties'),
        contents: contents
      })
    }

    const _fileContents = function (file) {
      return file.contents ? file.contents.toString() : null
    }

    it('should return JSON when namespace is empty', function (done) {
      const stream = props({namespace: ''})

      stream.once('data', function (file) {
        assert.equal(_fileContents(file), '{"name":"Gulp","message":"Hello!"}')
        assert.equal(file.extname, '.json')
        done()
      })

      stream.write(_createFile([
        '! Java .properties files are a good choice for internationalization and localization',
        'name = Gulp',
        'message = Hello!']))
      stream.end()
    })

    it('should return pretty JSON when namespace is empty and space=2 option defined', function (done) {
      const stream = props({namespace: '', space: 2})

      stream.once('data', function (file) {
        assert.equal(_fileContents(file), '{\n  "name": "Gulp",\n  "message": "Hello!"\n}')
        assert.equal(file.extname, '.json')
        done()
      })

      stream.write(_createFile([
        '! Java .properties files are a good choice for internationalization and localization',
        'name = Gulp',
        'message = Hello!']))
      stream.end()
    })

    it('should return pretty JSON when namespace is empty and space=4 option defined', function (done) {
      const stream = props({namespace: '', space: 4})

      stream.once('data', function (file) {
        assert.equal(_fileContents(file), '{\n    "name": "Gulp",\n    "message": "Hello!"\n}')
        assert.equal(file.extname, '.json')
        done()
      })

      stream.write(_createFile([
        '! Java .properties files are a good choice for internationalization and localization',
        'name = Gulp',
        'message = Hello!']))
      stream.end()
    })

    it('should use default namespace when not specified', function (done) {
      const stream = props()

      stream.once('data', function (file) {
        assert.equal(_fileContents(file),
          'var config = config || {};\nconfig[\'name\'] = \'Gulp\';\nconfig[\'message\'] = \'Hello!\';\n')
        assert.equal(file.extname, '.js')
        done()
      })

      stream.write(_createFile([
        '! Java .properties files are a good choice for internationalization and localization',
        'name = Gulp',
        'message = Hello!']))
      stream.end()
    })

    it('should use custom namespace', function (done) {
      const stream = props({namespace: 'state'})

      stream.once('data', function (file) {
        assert.equal(_fileContents(file),
          'var state = state || {};\nstate[\'name\'] = \'Gulp\';\nstate[\'message\'] = \'Hello!\';\n')
        assert.equal(file.extname, '.js')
        done()
      })

      stream.write(_createFile([
        '! Java .properties files are a good choice for internationalization and localization',
        'name = Gulp',
        'message = Hello!']))
      stream.end()
    })

    it('should reject reserved word for namespace', function (done) {
      const stream = props({namespace: 'void'})

      stream.once('error', function (error) {
        assert.equal(error.message, 'namespace option cannot be a reserved word.')
        done()
      })

      stream.write(_createFile(['message = hello']))
      stream.end()
    })

    it('should rename the namespace if not a valid identifier', function (done) {
      const stream = props({namespace: '123'})

      stream.once('data', function (file) {
        assert.equal(_fileContents(file),
          'var _123 = _123 || {};\n_123[\'name\'] = \'Gulp\';\n_123[\'message\'] = \'Hello!\';\n')
        assert.equal(file.extname, '.js')
        done()
      })

      stream.write(_createFile([
        '! Java .properties files are a good choice for internationalization and localization',
        'name = Gulp',
        'message = Hello!']))
      stream.end()
    })

    it('should append the extension instead of replacing it if appendExt flag is active', function (done) {
      const stream = props({appendExt: true})

      stream.once('data', function (file) {
        assert.equal(_fileContents(file), 'var config = config || {};\nconfig[\'test\'] = \'one\';\n')
        assert.equal(file.basename, 'noExt.1.js')
        done()
      })

      stream.write(_createFile(['test = one'], 'noExt.1'))
      stream.end()
    })

    it('should handle special characters properly', function (done) {
      const stream = props({namespace: 'state'})

      stream.once('data', function (file) {
        assert.equal(_fileContents(file),
          'var state = state || {};\nstate[\'a#b!c=d:\'] = \'AAAA#BBBB!CCCC=DDDD:EEEE\';\n')
        assert.equal(file.extname, '.js')
        done()
      })

      stream.write(_createFile([
        '! Special characters test',
        '\n',
        'a\\#b\\!c\\=d\\: = AAAA\\#BBBB\\',
        '               \\!CCCC\\=\\',
        '       DDDD\\:EEEE'
      ]))
      stream.end()
    })

    it('should handle empty content as JS object', function (done) {
      const stream = props({namespace: 'state'})

      stream.once('data', function (file) {
        assert.equal(_fileContents(file), 'var state = state || {};\n')
        assert.equal(file.extname, '.js')
        done()
      })

      stream.write(_createFile([]))
      stream.end()
    })

    it('should handle empty content as JSON', function (done) {
      const stream = props({namespace: ''})

      stream.once('data', function (file) {
        assert.equal(_fileContents(file), '{}')
        assert.equal(file.extname, '.json')
        done()
      })

      stream.write(_createFile([]))
      stream.end()
    })
  })

  describe('in stream mode', function () {
    const _createFile = function (filename, callback) {
      if (arguments.length === 1) {
        callback = arguments[0]
        filename = null
      }
      const stream = new Readable()
      stream._read = function () {
        callback.apply(this, arguments)
        this.push(null)
      }
      return new File({
        cwd: './',
        base: './test/',
        path: './test/' + (filename || 'mock.properties'),
        contents: stream
      })
    }

    it('should return JSON when namespace is empty', function (done) {
      const stream = props({namespace: ''})

      stream.once('data', function (file) {
        file.contents.pipe(es.wait(function (_, data) {
          assert.equal(data.toString(), '{"name":"Gulp","message":"Hello!"}')
          assert.equal(file.extname, '.json')
          done()
        }))
      })

      const file = _createFile(function () {
        this.push('! Java .properties files are a good choice for internationalization and localization\n')
        this.push('name = Gulp\n')
        this.push('message = Hello!\n')
      })

      stream.write(file)
      stream.end()
    })

    it('should return pretty JSON when namespace is empty and space=2 option defined', function (done) {
      const stream = props({namespace: '', space: 2})

      stream.once('data', function (file) {
        file.contents.pipe(es.wait(function (_, data) {
          assert.equal(data.toString(), '{\n  "name": "Gulp",\n  "message": "Hello!"\n}')
          assert.equal(file.extname, '.json')
          done()
        }))
      })

      const file = _createFile(function () {
        this.push('! Java .properties files are a good choice for internationalization and localization\n')
        this.push('name = Gulp\n')
        this.push('message = Hello!\n')
      })

      stream.write(file)
      stream.end()
    })

    it('should return pretty JSON when namespace is empty and space=4 option defined', function (done) {
      const stream = props({namespace: '', space: 4})

      stream.once('data', function (file) {
        file.contents.pipe(es.wait(function (_, data) {
          assert.equal(data.toString(), '{\n    "name": "Gulp",\n    "message": "Hello!"\n}')
          assert.equal(file.extname, '.json')
          done()
        }))
      })

      const file = _createFile(function () {
        this.push('! Java .properties files are a good choice for internationalization and localization\n')
        this.push('name = Gulp\n')
        this.push('message = Hello!\n')
      })

      stream.write(file)
      stream.end()
    })

    it('should use default namespace when not specified', function (done) {
      const stream = props()

      stream.once('data', function (file) {
        file.contents.pipe(es.wait(function (_, data) {
          assert.equal(data.toString(),
            'var config = config || {};\nconfig[\'name\'] = \'Gulp\';\nconfig[\'message\'] = \'Hello!\';\n')
          assert.equal(file.extname, '.js')
          done()
        }))
      })

      const file = _createFile(function () {
        this.push('! Java .properties files are a good choice for internationalization and localization\n')
        this.push('name = Gulp\n')
        this.push('message = Hello!\n')
      })

      stream.write(file)
      stream.end()
    })

    it('should use custom namespace', function (done) {
      const stream = props({namespace: 'state'})

      stream.once('data', function (file) {
        file.contents.pipe(es.wait(function (_, data) {
          assert.equal(data.toString(),
            'var state = state || {};\nstate[\'name\'] = \'Gulp\';\nstate[\'message\'] = \'Hello!\';\n')
          assert.equal(file.extname, '.js')
          done()
        }))
      })

      const file = _createFile(function () {
        this.push('! Java .properties files are a good choice for internationalization and localization\n')
        this.push('name = Gulp\n')
        this.push('message = Hello!\n')
      })

      stream.write(file)
      stream.end()
    })

    it('should reject reserved word for namespace', function (done) {
      const stream = props({namespace: 'void'})

      stream.once('error', function (error) {
        assert.equal(error.message, 'namespace option cannot be a reserved word.')
        done()
      })

      const file = _createFile(function () {
        this.push('! Java .properties files are a good choice for internationalization and localization\n')
        this.push('name = Gulp\n')
        this.push('message = Hello!\n')
      })

      stream.write(file)
      stream.end()
    })

    it('should rename the namespace if not a valid identifier', function (done) {
      const stream = props({namespace: '123'})

      stream.once('data', function (file) {
        file.contents.pipe(es.wait(function (_, data) {
          assert.equal(data.toString(),
            'var _123 = _123 || {};\n_123[\'name\'] = \'Gulp\';\n_123[\'message\'] = \'Hello!\';\n')
          assert.equal(file.extname, '.js')
          done()
        }))
      })

      const file = _createFile(function () {
        this.push('! Java .properties files are a good choice for internationalization and localization\n')
        this.push('name = Gulp\n')
        this.push('message = Hello!\n')
      })

      stream.write(file)
      stream.end()
    })

    it('should append the extension instead of replacing it if appendExt flag is active', function (done) {
      const stream = props({appendExt: true})

      stream.once('data', function (file) {
        file.contents.pipe(es.wait(function (_, data) {
          assert.equal(data.toString(), 'var config = config || {};\nconfig[\'test\'] = \'one\';\n')
          assert.equal(file.basename, 'noExt.1.js')
          done()
        }))
      })

      const file = _createFile('noExt.1', function () {
        this.push('test = one')
      })

      stream.write(file)
      stream.end()
    })

    it('should handle special characters properly', function (done) {
      const stream = props({namespace: 'state'})

      stream.once('data', function (file) {
        file.contents.pipe(es.wait(function (_, data) {
          assert.equal(data.toString(),
            'var state = state || {};\nstate[\'a#b!c=d:\'] = \'AAAA#BBBB!CCCC=DDDD:EEEE\';\n')
          assert.equal(file.extname, '.js')
          done()
        }))
      })

      const file = _createFile(function () {
        this.push([
          '! Special characters test',
          '\n',
          'a\\#b\\!c\\=d\\: = AAAA\\#BBBB\\',
          '               \\!CCCC\\=\\',
          '       DDDD\\:EEEE'
        ].join('\n'))
      })

      stream.write(file)
      stream.end()
    })

    it('should handle empty content as JS object', function (done) {
      const stream = props({namespace: 'state'})

      stream.once('data', function (file) {
        file.contents.pipe(es.wait(function (_, data) {
          assert.equal(data.toString(), 'var state = state || {};\n')
          assert.equal(file.extname, '.js')
          done()
        }))
      })

      stream.write(_createFile(function () {
        this.push('\n')
      }))
      stream.end()
    })

    it('should handle empty content as JSON', function (done) {
      const stream = props({namespace: ''})

      stream.once('data', function (file) {
        file.contents.pipe(es.wait(function (_, data) {
          assert.equal(data.toString(), '{}')
          assert.equal(file.extname, '.json')
          done()
        }))
      })

      stream.write(_createFile(function () {
        this.push('\n')
      }))
      stream.end()
    })
  })
})
