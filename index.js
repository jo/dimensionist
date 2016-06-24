#!/usr/bin/env node
/**
 * dimensionist - CouchDB daemon to extract dimensions from image attachments.
 *
 * Licensed under the MIT license.
 * https://github.com/jo/dimensionist
 * © 2014 Johannes J. Schmidt, null2 GmbH, Berlin
 *
 */

var pkg = require('./package.json');

var _ = require('highland');
var daemon = require('couch-daemon');
var async = require('async');
var nano = require('nano');
var sizeOf = require('http-image-size');


var supportedContentTypes = [
  'image/jpeg',
  'image/png',
  'image/gif'
];

daemon({
  name: pkg.name,
  version: pkg.version,
  include_docs: true
}, function(url, options) {
  var couch = nano(url);

  return function(source) {
    var sourceEnded = false;

    function check(data) {
      return data.stream === 'changes'
        && data.doc
        && data.doc._attachments;
    }
    
    function getSize(db, id, name, done) {
      var url = [
        couch.config.url,
        encodeURIComponent(db),
        encodeURIComponent(id),
        encodeURIComponent(name)
      ].join('/');

      sizeOf(url, done);
    }

    function processDocument(data, done) {
      var names = Object.keys(data.doc._attachments)
      .filter(function(name) {
        return supportedContentTypes.indexOf(data.doc._attachments[name].content_type) > -1;
      })
      .filter(function(name) {
        return !data.doc.dimensions
          || !data.doc.dimensions[name]
          || !data.doc.dimensions[name].revpos
          || data.doc.dimensions[name].revpos < data.doc._attachments[name].revpos;
      });

      if (!names.length) {
        return done(null, data);
      }

      done(null, {
        type: 'log',
        level: 'debug',
        message: 'processing: ' + data.db_name + '/' + data.id + '@' + data.seq + ' - ' + names.join(',')
      });

      async.map(names, function(name, next) {
        getSize(data.db_name, data.doc._id, name, function(err, dimension, bytes) {
          if (!err) {
            var res = _.extend({
              name: name,
              revpos: data.doc._attachments[name].revpos
            }, dimension);
            next(null, res);
          } else {
            next(err);
          }
        });
      }, function(err, results) {
        if (err) {
          return done({ stream: 'dimensionist', error: 'dimension_extract_error', reason: err });
        }
        data.doc.dimensions = data.doc.dimensions || {};
        results.forEach(function(dimension) {
          var name = dimension.name;
          delete dimension.name;
          data.doc.dimensions[name] = dimension;
        });

        couch.use(data.db_name).insert(data.doc, data.doc._id, function(err, resp) {
          if (err) {
            done({ stream: 'dimensionist', error: 'dimension_extract_error', reason: err });
          } else {
            done(null, {
              type: 'log',
              message: 'extracted image dimensions for ' + data.db_name + '/' + data.id + '@' + data.seq
            });
          }
          done(null, data);
        });
      });
    }

    var target = _(function(push, done) {
      push(null, {
        type: 'log',
        level: 'debug',
        message: 'Using configuration: ' + JSON.stringify(options).replace(/"password":"[^"]*"/, '"password":"***"')
      });

      source
        .on('data', function(data) {
          if (!data || !check(data)) {
            return push(null, data);
          }

          source.pause();

          processDocument(data, function(err, d) {
            push(err, d);
            
            source.resume();
          });
        })
        .on('error', push);
    });

    source.on('end', function() {
      sourceEnded = true;
    });

    return target;
  };
});

