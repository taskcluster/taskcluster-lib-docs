suite('End to End', () => {
  let assert = require('assert');
  let documenter = require('../');
  let debug = require('debug')('test');
  let _ = require('lodash');
  let tar = require('tar-stream');
  let rootdir = require('app-root-dir');
  let zlib = require('zlib');
  let validator = require('taskcluster-lib-validate');
  let base = require('taskcluster-base');

  test('tarball exists', async function() {
    let validate = await validator({
      folder: rootdir.get() + 'test/schemas',
      baseUrl: 'http://localhost:1203/',
      constants: {'my-constant': 42},
    });

    let schemas = validate.schemas;

    let tier = 'core';

    let doc = await documenter({
      schemas,
      tier,
    });
    assert.ok(doc.tgz);
  });

  test('test publish tarball', async function() {
    let validate = await validator({
      folder: './test/schemas',
      baseUrl: 'http://localhost:1203/',
      constants: {'my-constant': 42},
    });

    let cfg = base.config();
    let credentials = cfg.taskcluster.credentials;
    let publish = true;

    let doc = await documenter({
      project: 'testing',
      schemas: validate.schemas,
      tier: 'core',
      credentials,
      docsFolder: './test/docs/',
      publish,
    });
    assert.ok(doc.tgz);
  });

  test('tarball is empty', function() {
    let doc = documenter({
      tier: 'core',
    });
    assert.equal(doc.tgz, null);
  });

  test('tarball contains docs and metadata', async function(done) {

    let schemas = {};
    let tier = 'core';

    let shoulds = [
      'docs/example.md',
      'metadata.json',
    ];
    let contains = [];

    let doc = await documenter({
      schemas,
      docsFolder: './test/docs',
      tier,
    });

    let tarball = doc.tgz;

    let extractor = tar.extract();
    extractor.on('entry', (header, stream, callback) => {
      stream.on('end', () => {
        contains.push(header.name);
        callback(); // ready for next entry
      });

      stream.resume(); // just auto drain the stream
    });

    extractor.on('finish', function() {
      done(assert.deepEqual(contains.sort(), shoulds.sort()));
    });

    tarball.pipe(zlib.Unzip()).pipe(extractor);
  });

  test('tarball contains schemas and metadata', async function(done) {
    let validate = await validator({
      folder: './test/schemas',
      baseUrl: 'http://localhost:1203/',
      constants: {'my-constant': 42},
    });

    let shoulds = [
      'schema/foo.json',
      'schema/bar.json',
      'metadata.json',
    ];
    let contains = [];

    let doc = await documenter({
      schemas: validate.schemas,
      tier: 'core',
    });

    let tarball = doc.tgz;

    let extractor = tar.extract();
    extractor.on('entry', (header, stream, callback) => {
      stream.on('end', () => {
        contains.push(header.name);
        callback(); // ready for next entry
      });

      stream.resume(); // just auto drain the stream
    });

    extractor.on('finish', function() {
      done(assert.deepEqual(contains.sort(), shoulds.sort()));
    });

    tarball.pipe(zlib.Unzip()).pipe(extractor);
  });

  test('tarball contains references and metadata', async function(done) {
    let references = [
      {name: 'api', reference: 'api.reference'},
      {name: 'events', reference: 'exchanges.reference'},
    ];

    let shoulds = [
      'references/api.json',
      'references/events.json',
      'metadata.json',
    ];
    let contains = [];

    let doc = await documenter({
      references,
      tier: 'core',
    });

    let tarball = doc.tgz;

    let extractor = tar.extract();
    extractor.on('entry', (header, stream, callback) => {
      stream.on('end', () => {
        contains.push(header.name);
        callback(); // ready for next entry
      });

      stream.resume(); // just auto drain the stream
    });

    extractor.on('finish', function() {
      done(assert.deepEqual(contains.sort(), shoulds.sort()));
    });

    tarball.pipe(zlib.Unzip()).pipe(extractor);
  });

  test('tarball contains only metadata', async function(done) {
    let shoulds = [
      'metadata.json',
    ];

    let doc = await documenter({
      tier: 'core',
    });
    let contains = [];

    let tarball = doc.tgz;

    let extractor = tar.extract();
    extractor.on('entry', (header, stream, callback) => {
      stream.on('end', () => {
        contains.push(header.name);
        callback(); // ready for next entry
      });

      stream.resume(); // just auto drain the stream
    });

    extractor.on('finish', function() {
      done(assert.deepEqual(contains.sort(), shoulds.sort()));
    });

    tarball.pipe(zlib.Unzip()).pipe(extractor);
  });
});
