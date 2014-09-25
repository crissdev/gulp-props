'use strict';

var props = require('../');
var gutil = require('gulp-util');
var fs = require('fs');
var path = require('path');
var es = require('event-stream');

require('should');
require('mocha');


describe('gulp-props', function() {

    var demoFileBuffer,
        demoFileStream;


    beforeEach(function() {
        demoFileBuffer = new gutil.File({
            path: path.normalize('./test/demo.properties'),
            cwd: './test',
            contents: fs.readFileSync('./test/demo.properties')
        });
        demoFileStream = new gutil.File({
            path: path.normalize('./test/demo.properties'),
            cwd: './test',
            contents: fs.createReadStream('./test/demo.properties')
        });
    });


    it('should return JSON when namespace empty', function(done) {
        var stream = props({ namespace: '' });

        stream.once('data', function(file) {
            file.contents.toString('utf8').should.equal('{"name":"Gulp","message":"Hello!"}');
            file.path.should.equal('test/demo.json');
            done();
        });

        stream.write(demoFileBuffer);
        stream.end();
    });

    it('should return pretty JSON when namespace is empty and space=2 option defined', function(done) {
        var stream = props({ namespace: '', space: 2 });

        stream.once('data', function(file) {
            file.contents.toString('utf8').should.equal('{\n  "name": "Gulp",\n  "message": "Hello!"\n}');
            file.path.should.equal('test/demo.json');
            done();
        });

        stream.write(demoFileBuffer);
        stream.end();
    });

    it('should return pretty JSON when namespace is empty and space=4 option defined', function(done) {
        var stream = props({ namespace: '', space: 4 });

        stream.once('data', function(file) {
            file.contents.toString('utf8').should.equal('{\n    "name": "Gulp",\n    "message": "Hello!"\n}');
            file.path.should.equal('test/demo.json');
            done();
        });

        stream.write(demoFileBuffer);
        stream.end();
    });

    it('should use default namespace when not specified', function(done) {
        var stream = props();

        stream.once('data', function(file) {
            file.contents.toString('utf8').should.equal('var config = config || {};\nconfig[\'name\'] = \'Gulp\';\nconfig[\'message\'] = \'Hello!\';\n');
            file.path.should.equal('test/demo.js');
            done();
        });

        stream.write(demoFileBuffer);
        stream.end();
    });

    it('should use custom namespace', function(done) {
        var stream = props({ namespace: 'state' });

        stream.once('data', function(file) {
            file.contents.toString('utf8').should.equal('var state = state || {};\nstate[\'name\'] = \'Gulp\';\nstate[\'message\'] = \'Hello!\';\n');
            file.path.should.equal('test/demo.js');
            done();
        });

        stream.write(demoFileBuffer);
        stream.end();
    });

    it('should reject reserved word for namespace', function(done) {
        var stream = props({ namespace: 'void' });

        stream.once('error', function(error) {
            error.message.should.equal('namespace option cannot be a reserved word.');
            done();
        });

        stream.write(demoFileBuffer);
        stream.end();
    });

    it('should rename the namespace if is not a valid identifier', function(done) {
        var stream = props({ namespace: '123' });

        stream.once('data', function(file) {
            file.contents.toString('utf8').should.equal('var _123 = _123 || {};\n_123[\'name\'] = \'Gulp\';\n_123[\'message\'] = \'Hello!\';\n');
            file.path.should.equal('test/demo.js');
            done();
        });

        stream.write(demoFileBuffer);
        stream.end();
    });

    it('should work with streams', function(done) {
        var stream = props();

        stream.on('data', function(file) {
            file.pipe(es.wait(function(err, data) {
                data.toString('utf8').should.equal('var config = config || {};\nconfig[\'name\'] = \'Gulp\';\nconfig[\'message\'] = \'Hello!\';\n');
                file.path.should.equal('test/demo.js');
                done();
            }));
        });

        stream.write(demoFileStream);
        stream.end();
    });
});
