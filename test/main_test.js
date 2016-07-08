suite('End to End', () => {
  let assert = require('assert');
  let path = require('path');
  let documenter = require('../');
  let debug = require('debug')('test');
  let _ = require('lodash');
  let tar = require('tar-stream');

  test('tarball exists', async function() {
    let schemas = [
      {id: 'http://example.com/foo.schema.json', schema: 'http://json-schema.org/draft-04/schema#'},
      {id: 'http://example.com/bar.schema.json', schema: 'http://json-schema.org/draft-04/schema#'},
    ];
    let doc = await documenter({
      schemas, // schema.id + content
      docsFolder: path.join(__dirname, 'docs'),
    });
    assert.ok(doc.tarball); // testing tarball exists
  });

  test('tarball contains schemas and docs with prefix', async function(done) {
    let schemas = [
      {id: 'http://example.com/foo.schema.json', schema: 'http://json-schema.org/draft-04/schema#'},
      {id: 'http://example.com/bar.schema.json', schema: 'http://json-schema.org/draft-04/schema#'},
    ];

    let shoulds = [
      'schema/http://example.com/foo.schema.json',
      'schema/http://example.com/bar.schema.json',
      'docs/example.md',
    ];

    let doc = await documenter({
      schemas,
      docsFolder: path.join(__dirname, 'docs'),
    });

    let tarball = doc.tarball;

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

    tarball.pipe(extractor);
  });

  test('simplest case with nothing to do', async function() {
    let doc = documenter({
      folder: path.join(__dirname, 'docs'),
      bucket: 'taskcluster-raw-docs-test',
      project: 'taskcluster-lib-docs',
      version: '0.0.1',
    });
  });

});