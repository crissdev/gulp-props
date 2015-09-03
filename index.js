'use strict';

var gutil = require('gulp-util'),
    through = require('through2'),
    extend = require('extend'),
    propsParser = require('properties-parser'),
    isKeyword = require('is-keyword-js'),
    BufferStreams = require('bufferstreams'),
    PluginError = gutil.PluginError,
    PLUGIN_NAME = 'gulp-props',
    entryTemplate = '<%= data.ns%>[\'<%=data.key%>\'] = \'<%= data.value%>\';',
    rKey = /([\\'])/g,
    rValue = /([\\"'])/g;


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

function addProperty(obj, str, val) {
    str = str.split(".");
    while (str.length > 1) {
        var prop = str.shift();
        if (!obj.hasOwnProperty(prop)) {
            obj[prop] = {};
        }
        obj = obj[prop];
    }
    return obj[str.shift()] = val;
}

function createObjectFromProps(props) {
    var obj = {};
    Object.keys(props).forEach(function(key) {
        addProperty(obj, key, props[key]);
    });
    return obj;
}

function props2json(buffer, options) {
    var props = propsParser.parse(buffer.toString('utf8')),
        output,
        obj;

    if (options.namespace) {
        if (options.nestingDelimiter) {
            output = ['var ' + options.namespace + ' = ' + options.namespace + ' || {};'];
            obj = createObjectFromProps(props);
            output.push(options.namespace + '.' + options.nestingDelimiter + ' = ' + JSON.stringify(obj[options.nestingDelimiter]));
            output = output.join('\n') + '\n';
        } else {
            output = ['var ' + options.namespace + ' = ' + options.namespace + ' || {};'];
            Object.keys(props).forEach(function(key) {
                output.push(gutil.template(entryTemplate, {
                    file: {
                    },
                    data: {
                        ns: options.namespace,
                        key: key.replace(rKey, '\\$1'),
                        value: props[key].replace(rValue, '\\$1')
                    }
                }));
            });
            output = output.join('\n') + '\n';
        }
    }
    else if (options.createObject) {
        obj = createObjectFromProps(props);
        output = JSON.stringify(obj, options.replacer, options.space);
    }
    else {
        output = JSON.stringify(props, options.replacer, options.space);
    }
    return new Buffer(output);
}

function outputFilename(filepath, options) {
    return (options.appendExt) ?
        filepath + (options.namespace ? '.js' : '.json') :
            gutil.replaceExtension(filepath, options.namespace ? '.js' : '.json');
}


module.exports = function(options) {
    var self = this;
    options = extend({ namespace: 'config', space: null, replacer: null, appendExt: false, createObject: false, nestingDelimiter: null }, options);

    return through.obj(function(file, enc, callback) {
        if (options.namespace) {
            if (isKeyword(options.namespace)) {
                this.emit('error', new PluginError(PLUGIN_NAME,
                    'namespace option cannot be a reserved word.'));
                return callback();
            }
            options.namespace = getValidIdentifier(options.namespace);
        }

        if (file.isStream()) {
            file.contents = file.contents.pipe(new BufferStreams(function(err, buf, cb) {
                if (err) {
                    self.emit('error', new PluginError(PLUGIN_NAME, err.message));
                }
                else {
                    try {
                        cb(null, props2json(buf, options));
                        file.contents = props2json(file.contents, options);
                        file.path = outputFilename(file.path, options);
                    }
                    catch (error) {
                        self.emit('error', new PluginError(PLUGIN_NAME, error.message));
                        cb(error);
                    }
                }
            }));
        }
        else if (file.isBuffer()) {
            try {
                file.contents = props2json(file.contents, options);
                file.path = outputFilename(file.path, options);
            }
            catch (error) {
                this.emit('error', new PluginError(PLUGIN_NAME, error.message));
                return callback();
            }
        }
        this.push(file);
        return callback();
    });
};
