suite('End to End', () => {
  let assert = require('assert');
  let documenter = require('../');
  let debug = require('debug')('test');
  let _ = require('lodash');
  let tar = require('tar-stream');
  let rootdir = require('app-root-dir');
  let zlib = require('zlib');

  test('tarball exists', async function() {
    let schemas = [
      {'foo.json': {name: 'http://json-schema.org/draft-04/schema#'}},
      {'bar.json': {name: 'http://json-schema.org/draft-04/schema#'}},
    ];
    let doc = await documenter({
      schemas, // schema.id + content
    });
    assert.ok(doc.tgz); // testing tarball exists
  });

  test('tarball is empty', function() {
    let schemas = [];
    let docsFolder = [];

    let doc = documenter({
      schemas, // schema.id + content
      docsFolder: rootdir.get() + '/test/docs',
    });
    assert.equal(doc.tgz, null);
  });

  test('tarball contains only docs', async function(done) {
    let schemas = [];
    let shoulds = [
      'docs/example.md',
    ];

    let doc = await documenter({
      docsFolder: rootdir.get() + '/test/docs',
    });

    let tarball = doc.tgz;

    let extractor = tar.extract();
    extractor.on('entry', (header, stream, callback) => {
      let entryName = header.name;
      let contains = false;
      for (let expectedValue of shoulds) {
        if (expectedValue == entryName) {
          contains = true;
          break;
        }
      }
      assert.ok(contains);

      stream.on('end', () => {
        callback(); // ready for next entry
      });

      stream.resume(); // just auto drain the stream
    });

    extractor.on('finish', function() {
      done();
    });

    tarball.pipe(zlib.Unzip()).pipe(extractor);
  });

  test('tarball contains only schemas', async function(done) {
    let schemas = [
      {'foo.json': {name: 'http://json-schema.org/draft-04/schema#'}},
      {'bar.json': {name: 'http://json-schema.org/draft-04/schema#'}},
    ];

    let docFolder = [];

    let shoulds = [
      'schema/foo.json',
      'schema/bar.json',
    ];

    let doc = await documenter({
      schemas,
    });

    let tarball = doc.tgz;

    let extractor = tar.extract();
    extractor.on('entry', (header, stream, callback) => {
      let entryName = header.name;
      let contains = false;
      for (let expectedValue of shoulds) {
        if (expectedValue == entryName) {
          contains = true;
          break;
        }
      }
      assert.ok(contains);

      stream.on('end', () => {
        callback(); // ready for next entry
      });

      stream.resume(); // just auto drain the stream
    });

    extractor.on('finish', function() {
      done();
    });

    tarball.pipe(zlib.Unzip()).pipe(extractor);
  });

  test('tarball contains only references', async function(done) {
    let references = [
      {name: 'api', reference: 'api.reference'},
      {name: 'events', reference: 'exchanges.reference'},
    ];

    let docFolder = [];
    let schemas = [];

    let shoulds = [
      'references/api.json',
      'references/events.json',
    ];

    let doc = await documenter({
      schemas,
      references,
    });

    let tarball = doc.tgz;

    let extractor = tar.extract();
    extractor.on('entry', (header, stream, callback) => {
      let entryName = header.name;
      let contains = false;
      for (let expectedValue of shoulds) {
        if (expectedValue == entryName) {
          contains = true;
          break;
        }
      }
      assert.ok(contains);

      stream.on('end', () => {
        callback(); // ready for next entry
      });

      stream.resume(); // just auto drain the stream
    });

    extractor.on('finish', function() {
      done();
    });

    tarball.pipe(zlib.Unzip()).pipe(extractor);
  });

  test('tarball contains only metadata', async function(done) {

    let metadata = [
      {version: 1, tier: 'core'},
    ];

    let references = [];
    let docFolder = [];
    let schemas = [];

    let shoulds = [
      'metadata.json',
    ];

    let doc = await documenter({
      schemas,
      metadata,
    });

    let tarball = doc.tgz;

    let extractor = tar.extract();
    extractor.on('entry', (header, stream, callback) => {
      let entryName = header.name;
      let contains = false;
      for (let expectedValue of shoulds) {
        if (expectedValue == entryName) {
          contains = true;
          break;
        }
      }
      assert.ok(contains);

      stream.on('end', () => {
        callback(); // ready for next entry
      });

      stream.resume(); // just auto drain the stream
    });

    extractor.on('finish', function() {
      done();
    });

    tarball.pipe(zlib.Unzip()).pipe(extractor);
  });

});