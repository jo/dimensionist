#!/usr/bin/env node
/**
 * dimensionist - CouchDB daemon to extract dimensions from image attachments.
 *
 * Licensed under the MIT license.
 * https://github.com/jo/dimensionist
 * © 2014 Johannes J. Schmidt, null2 GmbH, Berlin
 *
 */

var _ = require('highland');
var daemon = require('couch-daemon');
var async = require('async');
var nano = require('nano');
var sizeOf = require('image-size');


var supportedContentTypes = [
  'image/jpeg',
  'image/png',
  'image/gif'
];

daemon({ include_docs: true }, function(url, options) {
  var couch = nano(url);

  return function(source) {
    var sourceEnded = false;

    function check(data) {
      return data.stream === 'changes'
        && data.doc
        && data.doc._attachments;
    }
    
    function getSize(db, id, name, bytes, done) {
      couch.request({
        db: db,
        doc: id,
        att: name,
        method: 'GET',
        encoding: null,
        dont_parse: true,
        headers: {
          Range: 'bytes=0-' + bytes
        }
      }, function(err, body) {
        var dimension = {};
        
        console.log(bytes, id);

        try {
          dimension = sizeOf(body);
        } catch(e) {
          console.log(e);

          // if (body.length < bytes) {
          //   console.log('something went wrong...');
          //   return done({ error: 'get_size', reason: e });
          // }

          // return getSize(db, id, name, bytes * 2, done);
        }
        
        console.log(bytes, body.length, dimension, db, id, name);

        done(null, dimension);
      });
    };

    function process(data, done) {
      var names = Object.keys(data.doc._attachments)
        .filter(function(name) {
          return supportedContentTypes.indexOf(data.doc._attachments[name].content_type) > -1;
        });

      done(null, {
        type: 'log',
        message: 'processing: ' + data.db_name + '/' + data.id + '@' + data.seq + ' - ' + names.join(',')
      });

      data.doc.dimensions = {};

      async.each(names, function(name, next) {
        getSize(data.db_name, data.doc._id, name, 256, function(err, dimension) {
          if (err) {
            return done(err);
          }

          data.doc.dimensions[name] = dimension;
        });
      }, function(err, resp) {
        if (err) {
          done({ error: 'dimension_extract_error' });
        }
        // couch.use(data.db_name).insert(data.doc, data.doc._id, function(err, resp) {
        //   if (err) {
        //     done({ error: 'dimension_extract_error' });
        //   }
        //   done(null, resp)
        //   // done(null, data);
        // });
      });
    }

    var target = _(function(push, done) {
      source
        .on('data', function(data) {
          if (!data || !check(data)) {
            return push(null, data);
          }

          source.pause();

          process(data, function(err, d) {
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

