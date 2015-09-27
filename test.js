/*global describe,it*/

var props     = require('./');
var File      = require('gulp-util').File;
var es        = require('event-stream');
var assert    = require('assert');
var Readable  = require('stream').Readable;


describe('gulp-props', function() {
  'use strict';

  describe('in buffer mode', function() {

    var _createFile = function(contents, filename) {
      if (typeof contents === 'string') {
        contents = new Buffer(contents, 'utf8');
      }
      else if (Array.isArray(contents)) {
        contents = new Buffer(contents.join('\n'), 'utf8');
      }
      return new File({
        cwd: './',
        base: './test/',
        path: './test/' + (filename || 'mock.properties'),
        contents: contents
      });
    };

    var _fileContents = function(file) {
      return file.contents ? file.contents.toString('utf8') : null;
    };

    it('should return JSON when namespace is empty', function(done) {
      var stream = props({namespace: ''});

      stream.once('data', function(file) {
        assert.equal(_fileContents(file), '{"name":"Gulp","message":"Hello!"}');
        assert.equal(file.extname, '.json');
        done();
      });

      stream.write(_createFile([
        '! Java .properties files are a good choice for internationalization and localization',
        'name = Gulp',
        'message = Hello!']));
      stream.end();
    });

    it('should return pretty JSON when namespace is empty and space=2 option defined', function(done) {
      var stream = props({namespace: '', space: 2});

      stream.once('data', function(file) {
        assert.equal(_fileContents(file), '{\n  "name": "Gulp",\n  "message": "Hello!"\n}');
        assert.equal(file.extname, '.json');
        done();
      });

      stream.write(_createFile([
        '! Java .properties files are a good choice for internationalization and localization',
        'name = Gulp',
        'message = Hello!']));
      stream.end();
    });

    it('should return pretty JSON when namespace is empty and space=4 option defined', function(done) {
      var stream = props({namespace: '', space: 4});

      stream.once('data', function(file) {
        assert.equal(_fileContents(file), '{\n    "name": "Gulp",\n    "message": "Hello!"\n}');
        assert.equal(file.extname, '.json');
        done();
      });

      stream.write(_createFile([
        '! Java .properties files are a good choice for internationalization and localization',
        'name = Gulp',
        'message = Hello!']));
      stream.end();
    });

    it('should use default namespace when not specified', function(done) {
      var stream = props();

      stream.once('data', function(file) {
        assert.equal(_fileContents(file),
          "var config = config || {};\nconfig['name'] = 'Gulp';\nconfig['message'] = 'Hello!';\n");
        assert.equal(file.extname, '.js');
        done();
      });

      stream.write(_createFile([
        '! Java .properties files are a good choice for internationalization and localization',
        'name = Gulp',
        'message = Hello!']));
      stream.end();
    });

    it('should use custom namespace', function(done) {
      var stream = props({namespace: 'state'});

      stream.once('data', function(file) {
        assert.equal(_fileContents(file),
          "var state = state || {};\nstate['name'] = 'Gulp';\nstate['message'] = 'Hello!';\n");
        assert.equal(file.extname, '.js');
        done();
      });

      stream.write(_createFile([
        '! Java .properties files are a good choice for internationalization and localization',
        'name = Gulp',
        'message = Hello!']));
      stream.end();
    });

    it('should reject reserved word for namespace', function(done) {
      var stream = props({namespace: 'void'});

      stream.once('error', function(error) {
        assert.equal(error.message, 'namespace option cannot be a reserved word.');
        done();
      });

      stream.write(_createFile(['message = hello']));
      stream.end();
    });

    it('should rename the namespace if not a valid identifier', function(done) {
      var stream = props({namespace: '123'});

      stream.once('data', function(file) {
        assert.equal(_fileContents(file),
          "var _123 = _123 || {};\n_123['name'] = 'Gulp';\n_123['message'] = 'Hello!';\n");
        assert.equal(file.extname, '.js');
        done();
      });

      stream.write(_createFile([
        '! Java .properties files are a good choice for internationalization and localization',
        'name = Gulp',
        'message = Hello!']));
      stream.end();
    });

    it('should append the extension instead of replacing it if appendExt flag is active', function(done) {
      var stream = props({appendExt: true});

      stream.once('data', function(file) {
        assert.equal(_fileContents(file), "var config = config || {};\nconfig['test'] = 'one';\n");
        assert.equal(file.basename, 'noExt.1.js');
        done();
      });

      stream.write(_createFile(['test = one'], 'noExt.1'));
      stream.end();
    });

    it('should handle special characters properly', function(done) {
      var stream = props({namespace: 'state'});

      stream.once('data', function(file) {
        assert.equal(_fileContents(file),
          "var state = state || {};\nstate['a#b!c=d:'] = 'AAAA#BBBB!CCCC=DDDD:EEEE';\n");
        assert.equal(file.extname, '.js');
        done();
      });

      stream.write(_createFile([
        '! Special characters test',
        '\n',
        'a\\#b\\!c\\=d\\: = AAAA\\#BBBB\\',
        '               \\!CCCC\\=\\',
        '       DDDD\\:EEEE'
      ]));
      stream.end();
    });

    it('should handle empty content as JS object', function(done) {
      var stream = props({namespace: 'state'});

      stream.once('data', function(file) {
        assert.equal(_fileContents(file), 'var state = state || {};\n');
        assert.equal(file.extname, '.js');
        done();
      });

      stream.write(_createFile([]));
      stream.end();
    });

    it('should handle empty content as JSON', function(done) {
      var stream = props({namespace: ''});

      stream.once('data', function(file) {
        assert.equal(_fileContents(file), '{}');
        assert.equal(file.extname, '.json');
        done();
      });

      stream.write(_createFile([]));
      stream.end();
    });
  });

  describe('in stream mode', function() {

    var _createFile = function(filename, callback) {
      if (arguments.length === 1) {
        callback = arguments[0];
        filename = null;
      }
      var stream = new Readable();
      stream._read = function() {
        callback.apply(this, arguments);
        this.push(null);
      };
      return new File({
        cwd: './',
        base: './test/',
        path: './test/' + (filename || 'mock.properties'),
        contents: stream
      });
    };

    it('should return JSON when namespace is empty', function(done) {

      var stream = props({namespace: ''});

      stream.once('data', function(file) {
        file.contents.pipe(es.wait(function(err, data) {
          assert.equal(data.toString('utf8'), '{"name":"Gulp","message":"Hello!"}');
          assert.equal(file.extname, '.json');
          done();
        }));
      });

      var file = _createFile(function() {
        this.push('! Java .properties files are a good choice for internationalization and localization\n');
        this.push('name = Gulp\n');
        this.push('message = Hello!\n');
      });

      stream.write(file);
      stream.end();
    });

    it('should return pretty JSON when namespace is empty and space=2 option defined', function(done) {
      var stream = props({namespace: '', space: 2});

      stream.once('data', function(file) {
        file.contents.pipe(es.wait(function(err, data) {
          assert.equal(data.toString('utf8'), '{\n  "name": "Gulp",\n  "message": "Hello!"\n}');
          assert.equal(file.extname, '.json');
          done();
        }));
      });

      var file = _createFile(function() {
        this.push('! Java .properties files are a good choice for internationalization and localization\n');
        this.push('name = Gulp\n');
        this.push('message = Hello!\n');
      });

      stream.write(file);
      stream.end();
    });

    it('should return pretty JSON when namespace is empty and space=4 option defined', function(done) {
      var stream = props({namespace: '', space: 4});

      stream.once('data', function(file) {
        file.contents.pipe(es.wait(function(err, data) {
          assert.equal(data.toString('utf8'), '{\n    "name": "Gulp",\n    "message": "Hello!"\n}');
          assert.equal(file.extname, '.json');
          done();
        }));
      });

      var file = _createFile(function() {
        this.push('! Java .properties files are a good choice for internationalization and localization\n');
        this.push('name = Gulp\n');
        this.push('message = Hello!\n');
      });

      stream.write(file);
      stream.end();
    });

    it('should use default namespace when not specified', function(done) {
      var stream = props();

      stream.once('data', function(file) {
        file.contents.pipe(es.wait(function(err, data) {
          assert.equal(data.toString('utf8'),
            "var config = config || {};\nconfig['name'] = 'Gulp';\nconfig['message'] = 'Hello!';\n");
          assert.equal(file.extname, '.js');
          done();
        }));
      });

      var file = _createFile(function() {
        this.push('! Java .properties files are a good choice for internationalization and localization\n');
        this.push('name = Gulp\n');
        this.push('message = Hello!\n');
      });

      stream.write(file);
      stream.end();
    });

    it('should use custom namespace', function(done) {
      var stream = props({namespace: 'state'});

      stream.once('data', function(file) {
        file.contents.pipe(es.wait(function(err, data) {
          assert.equal(data.toString('utf8'),
            "var state = state || {};\nstate['name'] = 'Gulp';\nstate['message'] = 'Hello!';\n");
          assert.equal(file.extname, '.js');
          done();
        }));
      });

      var file = _createFile(function() {
        this.push('! Java .properties files are a good choice for internationalization and localization\n');
        this.push('name = Gulp\n');
        this.push('message = Hello!\n');
      });

      stream.write(file);
      stream.end();
    });

    it('should reject reserved word for namespace', function(done) {
      var stream = props({namespace: 'void'});

      stream.once('error', function(error) {
        assert.equal(error.message, 'namespace option cannot be a reserved word.');
        done();
      });

      var file = _createFile(function() {
        this.push('! Java .properties files are a good choice for internationalization and localization\n');
        this.push('name = Gulp\n');
        this.push('message = Hello!\n');
      });

      stream.write(file);
      stream.end();
    });

    it('should rename the namespace if not a valid identifier', function(done) {
      var stream = props({namespace: '123'});

      stream.once('data', function(file) {
        file.contents.pipe(es.wait(function(err, data) {
          assert.equal(data.toString('utf8'),
            "var _123 = _123 || {};\n_123['name'] = 'Gulp';\n_123['message'] = 'Hello!';\n");
          assert.equal(file.extname, '.js');
          done();
        }));
      });

      var file = _createFile(function() {
        this.push('! Java .properties files are a good choice for internationalization and localization\n');
        this.push('name = Gulp\n');
        this.push('message = Hello!\n');
      });

      stream.write(file);
      stream.end();
    });

    it('should append the extension instead of replacing it if appendExt flag is active', function(done) {
      var stream = props({appendExt: true});

      stream.once('data', function(file) {
        file.contents.pipe(es.wait(function(err, data) {
          assert.equal(data.toString('utf8'), "var config = config || {};\nconfig['test'] = 'one';\n");
          assert.equal(file.basename, 'noExt.1.js');
          done();
        }));
      });

      var file = _createFile('noExt.1', function() {
        this.push('test = one');
      });

      stream.write(file);
      stream.end();
    });

    it('should handle special characters properly', function(done) {
      var stream = props({namespace: 'state'});

      stream.once('data', function(file) {
        file.contents.pipe(es.wait(function(err, data) {
          assert.equal(data.toString('utf8'),
            "var state = state || {};\nstate['a#b!c=d:'] = 'AAAA#BBBB!CCCC=DDDD:EEEE';\n");
          assert.equal(file.extname, '.js');
          done();
        }));
      });

      var file = _createFile(function() {
        this.push([
          '! Special characters test',
          '\n',
          'a\\#b\\!c\\=d\\: = AAAA\\#BBBB\\',
          '               \\!CCCC\\=\\',
          '       DDDD\\:EEEE'
        ].join('\n'));
      });

      stream.write(file);
      stream.end();
    });

    it('should handle empty content as JS object', function(done) {
      var stream = props({namespace: 'state'});

      stream.once('data', function(file) {
        file.contents.pipe(es.wait(function(err, data) {
          assert.equal(data.toString('utf8'), 'var state = state || {};\n');
          assert.equal(file.extname, '.js');
          done();
        }));
      });

      stream.write(_createFile(function() {
        this.push('\n');
      }));
      stream.end();
    });

    it('should handle empty content as JSON', function(done) {
      var stream = props({namespace: ''});

      stream.once('data', function(file) {
        file.contents.pipe(es.wait(function(err, data) {
          assert.equal(data.toString('utf8'), '{}');
          assert.equal(file.extname, '.json');
          done();
        }));
      });

      stream.write(_createFile(function() {
        this.push('\n');
      }));
      stream.end();
    });
  });
});
