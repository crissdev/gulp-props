'use strict';

var props = require('../'),
    gutil = require('gulp-util'),
    File = gutil.File,
    fs = require('fs'),
    path = require('path'),
    es = require('event-stream');

require('should');
require('mocha');


describe('gulp-props', function() {

    // Test files

    var validFile,
        noExtFile,
        emptyFile,
        specialFile,
        nullFile;


    describe('in buffer mode', function() {

        beforeEach(function() {
            validFile = new File({
                path: 'test/valid.properties',
                cwd: 'test',
                contents: fs.readFileSync('test/valid.properties')
            });
            noExtFile = new File({
                path: 'test/noExt.1',
                cwd: 'test',
                contents: new Buffer('test/noExt.1')
            });
            emptyFile = new File({
                path: 'test/empty.properties',
                cwd: 'test',
                contents: new Buffer('')
            });
            specialFile = new File({
                path: 'test/special.properties',
                cwd: 'test',
                contents: fs.readFileSync('test/special.properties')
            });

            nullFile = new File({
                cwd: 'test',
                contents: null
            });
        });

        it('should return JSON when namespace is empty', function(done) {
            var stream = props({ namespace: '' });

            stream.once('data', function(file) {
                file.contents.toString('utf8').should.equal('{"name":"Gulp","message":"Hello!"}');
                path.extname(file.path).should.equal('.json');
                done();
            });

            stream.write(validFile);
            stream.end();
        });

        it('should return pretty JSON when namespace is empty and space=2 option defined', function(done) {
            var stream = props({ namespace: '', space: 2 });

            stream.once('data', function(file) {
                file.contents.toString('utf8').should.equal('{\n  "name": "Gulp",\n  "message": "Hello!"\n}');
                path.extname(file.path).should.equal('.json');
                done();
            });

            stream.write(validFile);
            stream.end();
        });

        it('should return pretty JSON when namespace is empty and space=4 option defined', function(done) {
            var stream = props({ namespace: '', space: 4 });

            stream.once('data', function(file) {
                file.contents.toString('utf8').should.equal('{\n    "name": "Gulp",\n    "message": "Hello!"\n}');
                path.extname(file.path).should.equal('.json');
                done();
            });

            stream.write(validFile);
            stream.end();
        });

        it('should use default namespace when not specified', function(done) {
            var stream = props();

            stream.once('data', function(file) {
                file.contents.toString('utf8').should.equal('var config = config || {};\nconfig[\'name\'] = \'Gulp\';\nconfig[\'message\'] = \'Hello!\';\n');
                path.extname(file.path).should.equal('.js');
                done();
            });

            stream.write(validFile);
            stream.end();
        });

        it('should use custom namespace', function(done) {
            var stream = props({ namespace: 'state' });

            stream.once('data', function(file) {
                file.contents.toString('utf8').should.equal('var state = state || {};\nstate[\'name\'] = \'Gulp\';\nstate[\'message\'] = \'Hello!\';\n');
                path.extname(file.path).should.equal('.js');
                done();
            });

            stream.write(validFile);
            stream.end();
        });

        it('should reject reserved word for namespace', function(done) {
            var stream = props({ namespace: 'void' });

            stream.once('error', function(error) {
                error.message.should.equal('namespace option cannot be a reserved word.');
                done();
            });

            stream.write(validFile);
            stream.end();
        });

        it('should rename the namespace if is not a valid identifier', function(done) {
            var stream = props({ namespace: '123' });

            stream.once('data', function(file) {
                file.contents.toString('utf8').should.equal('var _123 = _123 || {};\n_123[\'name\'] = \'Gulp\';\n_123[\'message\'] = \'Hello!\';\n');
                path.extname(file.path).should.equal('.js');
                done();
            });

            stream.write(validFile);
            stream.end();
        });

        it('should append the extension instead of replacing it if appendExt flag is active', function(done) {
            var stream = props({ appendExt: true });

            stream.once('data', function(file) {
                path.basename(file.path).should.equal('noExt.1.js');
                done();
            });

            stream.write(noExtFile);
            stream.end();
        });

        it('should handle special characters properly', function(done) {
            var stream = props({ namespace: 'state' });

            stream.once('data', function(file) {
                file.contents.toString('utf8').should.equal('var state = state || {};\nstate[\'a#b!c=d:\'] = \'AAAA#BBBB!CCCC=DDDD:EEEE\';\n');
                path.extname(file.path).should.equal('.js');
                done();
            });

            stream.write(specialFile);
            stream.end();
        });

        it('should do nothing when contents is null', function(done) {
            var stream = props();

            stream.once('data', function(file) {
                file.isNull().should.equal(true);
                path.extname(file.path).should.equal('');
                done();
            });

            stream.write(nullFile);
            stream.end();
        });
    });

    describe('in stream mode', function() {

        beforeEach(function() {
            validFile = new File({
                path: 'test/valid.properties',
                cwd: 'test',
                contents: fs.createReadStream('test/valid.properties')
            });
            emptyFile = new File({
                path: 'test/empty.properties',
                cwd: 'test',
                contents: fs.createReadStream('test/empty.properties')
            });
            specialFile = new File({
                path: 'test/special.properties',
                cwd: 'test',
                contents: fs.createReadStream('test/special.properties')
            });
        });

        it('should return JSON when namespace is empty', function(done) {
            var stream = props({ namespace: '' });

            stream.once('data', function(file) {
                file.contents.pipe(es.wait(function(err, data) {
                    data.toString('utf8').should.equal('{"name":"Gulp","message":"Hello!"}');
                    path.extname(file.path).should.equal('.json');
                    done();
                }));
            });

            stream.write(validFile);
            stream.end();
        });

        it('should return pretty JSON when namespace is empty and space=2 option defined', function(done) {
            var stream = props({ namespace: '', space: 2 });

            stream.once('data', function(file) {
                file.contents.pipe(es.wait(function(err, data) {
                    data.toString('utf8').should.equal('{\n  "name": "Gulp",\n  "message": "Hello!"\n}');
                    path.extname(file.path).should.equal('.json');
                    done();
                }));
            });

            stream.write(validFile);
            stream.end();
        });

        it('should return pretty JSON when namespace is empty and space=4 option defined', function(done) {
            var stream = props({ namespace: '', space: 4 });

            stream.once('data', function(file) {
                file.contents.pipe(es.wait(function(err, data) {
                    data.toString('utf8').should.equal('{\n    "name": "Gulp",\n    "message": "Hello!"\n}');
                    path.extname(file.path).should.equal('.json');
                    done();
                }));
            });

            stream.write(validFile);
            stream.end();
        });

        it('should use default namespace when not specified', function(done) {
            var stream = props();

            stream.once('data', function(file) {
                file.contents.pipe(es.wait(function(err, data) {
                    data.toString('utf8').should.equal('var config = config || {};\nconfig[\'name\'] = \'Gulp\';\nconfig[\'message\'] = \'Hello!\';\n');
                    path.extname(file.path).should.equal('.js');
                    done();
                }));
            });

            stream.write(validFile);
            stream.end();
        });

        it('should use custom namespace', function(done) {
            var stream = props({ namespace: 'state' });

            stream.once('data', function(file) {
                file.contents.pipe(es.wait(function(err, data) {
                    data.toString('utf8').should.equal('var state = state || {};\nstate[\'name\'] = \'Gulp\';\nstate[\'message\'] = \'Hello!\';\n');
                    path.extname(file.path).should.equal('.js');
                    done();
                }));
            });

            stream.write(validFile);
            stream.end();
        });

        it('should reject reserved word for namespace', function(done) {
            var stream = props({ namespace: 'void' });

            stream.once('error', function(error) {
                error.message.should.equal('namespace option cannot be a reserved word.');
                done();
            });

            stream.write(validFile);
            stream.end();
        });

        it('should rename the namespace if is not a valid identifier', function(done) {
            var stream = props({ namespace: '123' });

            stream.once('data', function(file) {
                file.contents.pipe(es.wait(function(err, data) {
                    data.toString('utf8').should.equal('var _123 = _123 || {};\n_123[\'name\'] = \'Gulp\';\n_123[\'message\'] = \'Hello!\';\n');
                    path.extname(file.path).should.equal('.js');
                    done();
                }));
            });

            stream.write(validFile);
            stream.end();
        });

        it('should handle special characters properly', function(done) {
            var stream = props({ namespace: 'state' });

            stream.once('data', function(file) {
                file.contents.pipe(es.wait(function(err, data) {
                    data.toString('utf8').should.equal('var state = state || {};\nstate[\'a#b!c=d:\'] = \'AAAA#BBBB!CCCC=DDDD:EEEE\';\n');
                    path.extname(file.path).should.equal('.js');
                    done();
                }));
            });

            stream.write(specialFile);
            stream.end();
        });
    });
});
