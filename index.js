'use strict'

const propsParser = require('properties-parser')
const through = require('through2')
const isKeyword = require('is-keyword-js')
const BufferStreams = require('bufferstreams')
const replaceExt = require('replace-ext')
const PluginError = require('plugin-error')
const assign = require('object-assign')
const template = require('lodash.template')
const fancyLog = require('fancy-log')

const PLUGIN_NAME = 'gulp-props'
const compiledEntryTemplate = template(`<%=ns%>['<%=key%>'] = '<%=value%>';`)
const rKey = /(?:[\\'])/g
const rValue = /(?:[\\"'])/g

module.exports = function (options) {
  options = assign({namespace: 'config', space: null, replacer: null, appendExt: false}, options)

  return through.obj(function (file, enc, callback) {
    const stream = this

    file.contents = getFileContents(file, options, stream, callback)

    stream.push(file)
    callback()
  })
}

function getValidIdentifier (str) {
  let identifier = str.replace(/[^a-z0-9_$]/ig, '_')

  if (/^[0-9]+/.test(identifier)) {
    identifier = '_' + identifier
  }
  if (identifier !== str) {
    fancyLog.warn(`${PLUGIN_NAME}: namespace option was renamed to ${identifier} to be a valid variable name.`)
  }
  return identifier
}

function convertProps (file, buf, options) {
  if (options.namespace) {
    if (isKeyword(options.namespace)) {
      return getError('namespace option cannot be a reserved word.')
    }
    options.namespace = getValidIdentifier(options.namespace)
  }
  try {
    file.path = outputFilename(file.path, options)
    return props2json(buf, options)
  } catch (error) {
    return getError(error)
  }
}

function props2json (buffer, options) {
  const props = propsParser.parse(buffer.toString('utf8'))
  let jsonValue

  if (options.namespace) {
    const output = [`var ${options.namespace} = ${options.namespace} || {};`]

    for (const key of Object.keys(props)) {
      const fragment = compiledEntryTemplate({
        ns: options.namespace,
        key: key.replace(rKey, '\\$1'),
        value: props[key].replace(rValue, '\\$1')
      })
      output.push(fragment)
    }

    output.push('')
    jsonValue = output.join('\n')
  } else {
    jsonValue = JSON.stringify(props, options.replacer, options.space)
  }
  return Buffer.from(jsonValue)
}

function outputFilename (filePath, options) {
  const ext = options.namespace ? '.js' : '.json'
  return options.appendExt ? filePath + ext : replaceExt(filePath, ext)
}

function getFileContents (file, options, stream, callback) {
  if (file.isNull()) {
    return file.contents
  }

  if (file.isBuffer()) {
    return getBufferContents(file, options, stream, callback)
  }

  if (file.isStream()) {
    return getStreamContents(file, options, stream)
  }
}

function getBufferContents (file, options, stream, callback) {
  const output = convertProps(file, file.contents, options)

  if (output instanceof PluginError) {
    stream.emit('error', output)
    return callback()
  }

  return output
}

function getStreamContents (file, options, stream) {
  const streamer = new BufferStreams(function (err, buf, callback) {
    if (err) {
      stream.emit('error', getError(err))
      return callback()
    }

    const output = convertProps(file, buf, options)

    if (output instanceof PluginError) {
      stream.emit('error', output)
      return callback()
    }

    callback(null, output)
  })

  return file.contents.pipe(streamer)
}

function getError (error) {
  return new PluginError(PLUGIN_NAME, error, {showStack: true})
}
