'use strict';

var gutil         = require('gulp-util');
var through       = require('through2');
var propsParser   = require('properties-parser');
var isKeyword     = require('is-keyword-js');
var xtend         = require('xtend');
var BufferStreams = require('bufferstreams');
var PluginError   = gutil.PluginError;
var PLUGIN_NAME   = 'gulp-props';
var entryTemplate = "<%= data.ns%>['<%=data.key%>'] = '<%= data.value%>';";
var rKey          = /(?:[\\'])/g;
var rValue        = /(?:[\\"'])/g;


function getValidIdentifier(str) {
  var identifier = str.replace(/[^a-z0-9_$]/ig, '_');

  if (/^[0-9]+/.test(identifier)) {
    identifier = '_' + identifier;
  }
  if (identifier !== str) {
    gutil.log(gutil.colors.yellow(PLUGIN_NAME + ': namespace option was renamed to ' +
      identifier + ' to be a valid variable name.'));
  }
  return identifier;
}

function props2json(buffer, options) {
  var props = propsParser.parse(buffer.toString('utf8')),
    output;

  if (options.namespace) {
    output = ['var ' + options.namespace + ' = ' + options.namespace + ' || {};'];

    Object.keys(props).forEach(function(key) {
      output.push(gutil.template(entryTemplate, {
        file: {},
        data: {
          ns: options.namespace,
          key: key.replace(rKey, '\\$1'),
          value: props[key].replace(rValue, '\\$1')
        }
      }));
    });
    output = output.join('\n') + '\n';
  }
  else {
    output = JSON.stringify(props, options.replacer, options.space);
  }
  return new Buffer(output);
}

function outputFilename(filepath, options) {
  return (options.appendExt) ? filepath + (options.namespace ? '.js' : '.json') :
    gutil.replaceExtension(filepath, options.namespace ? '.js' : '.json');
}

module.exports = function(options) {
  options = xtend({namespace: 'config', space: null, replacer: null, appendExt: false}, options);

  return through.obj(function(file, enc, callback) {
    if (options.namespace) {
      if (isKeyword(options.namespace)) {
        this.emit('error', new PluginError(PLUGIN_NAME, 'namespace option cannot be a reserved word.'));
        return callback();
      }
      options.namespace = getValidIdentifier(options.namespace);
    }

    if (file.isStream()) {
      var _this = this;
      var streamer = new BufferStreams(function(err, buf, cb) {
        if (err) {
          _this.emit('error', new PluginError(PLUGIN_NAME, err, {showStack: true}));
        }
        else {
          try {
            var parsed = props2json(buf, options);
            file.path = outputFilename(file.path, options);
            cb(null, parsed);
          }
          catch (error) {
            _this.emit('error', new PluginError(PLUGIN_NAME, error, {showStack: true}));
          }
        }
      });
      file.contents = file.contents.pipe(streamer);
    }
    else if (file.isBuffer()) {
      try {
        file.contents = props2json(file.contents, options);
        file.path = outputFilename(file.path, options);
      }
      catch (error) {
        this.emit('error', new PluginError(PLUGIN_NAME, error, {showStack: true}));
        return callback();
      }
    }
    this.push(file);
    callback();
  });
};
