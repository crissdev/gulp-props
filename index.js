'use strict';

var gutil = require('gulp-util'),
    through = require('through2'),
    extend = require('extend'),
    propsParser = require('properties-parser'),
    isKeyword = require('is-keyword-js'),
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


module.exports = function(options) {
    options = extend({ namespace: 'config', space: null, replacer: null }, options);

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
            throw new PluginError(PLUGIN_NAME, 'Streaming is not supported!');
        }
        else if (file.isNull()) {
            this.push(file);
            return callback();
        }
        else if (file.isBuffer()) {
            try {
                var props = propsParser.parse(file.contents.toString('utf8')),
                    output;

                if (options.namespace) {
                    output = ['var ' + options.namespace + ' = ' + options.namespace + ' || {};'];

                    Object.keys(props).forEach(function(key) {
                        output.push(gutil.template(entryTemplate, {
                            file: file,
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
                file.contents = new Buffer(output);
            }
            catch (error) {
                this.emit('error', new PluginError(PLUGIN_NAME, error.message));
                return callback();
            }

            this.push(file);
            return callback();
        }
    });
};
