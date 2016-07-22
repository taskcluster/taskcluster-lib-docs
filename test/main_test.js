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
      {'foo.json': {schema: 'http://json-schema.org/draft-04/schema#'}},
      {'bar.json': {schema: 'http://json-schema.org/draft-04/schema#'}},
    ];

    let tier = 'core';
    let menuIndex = 1;

    let doc = await documenter({
      schemas,
      tier,
      menuIndex,
    });
    assert.ok(doc.tgz);
  });

  test('tarball is empty', function() {
    let schemas = [];
    let docsFolder = [];

    let tier = 'core';
    let menuIndex = 1;

    let doc = documenter({
      tier,
      menuIndex,
      schemas,
      // docsFolder: rootdir.get() + '/test/docs',
      docsFolder: rootdir.get() + '/docs',
    });
    assert.equal(doc.tgz, null);
  });

  test('tarball contains docs and metadata', async function(done) {

    let schemas = [];
    let tier = 'core';
    let menuIndex = 1;

    let shoulds = [
      'docs/example.md',
      'metadata.json',
    ];

    let doc = await documenter({
      schemas,
      // docsFolder: rootdir.get() + '/test/docs',
      docsFolder: rootdir.get() + '/docs',
      tier,
      menuIndex,
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

  test('tarball contains schemas and metadata', async function(done) {
    let schemas = [
      {'foo.json': {schema: 'http://json-schema.org/draft-04/schema#'}},
      {'bar.json': {schema: 'http://json-schema.org/draft-04/schema#'}},
    ];

    let tier = 'core';
    let menuIndex = 1;

    let docFolder = [];

    let shoulds = [
      'schema/foo.json',
      'schema/bar.json',
      'metadata.json',
    ];

    let doc = await documenter({
      schemas,
      tier,
      menuIndex,
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

  test('tarball contains references and metadata', async function(done) {
    let references = [
      {name: 'api', reference: 'api.reference'},
      {name: 'events', reference: 'exchanges.reference'},
    ];

    let tier = 'core';
    let menuIndex = 1;

    let schemas = [];

    let shoulds = [
      'references/api.json',
      'references/events.json',
      'metadata.json',
    ];

    let doc = await documenter({
      schemas,
      references,
      tier,
      menuIndex,
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

    let schemas = [];
    let tier = 'core';
    let menuIndex = 1;

    let shoulds = [
      'metadata.json',
    ];

    let doc = await documenter({
      schemas,
      tier,
      menuIndex,
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