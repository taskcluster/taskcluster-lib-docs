suite('End to End', () => {
  let assert = require('assert');
  let path = require('path');
  let documenter = require('../');
  let debug = require('debug')('test');
  let validator = require('taskcluster-lib-validate');

  let validate = null;

  setup(async () => {
    validate = await validator({
      folder: path.join(__dirname, 'schemas'),
      baseUrl: 'http://localhost:1203/',
      constants: {},
    });
  });

  test('tarball exists', async function() {
    let schemas = [
      {name: 'foo.json', content: 'foo'},
      {name: 'bar.json', content: 'bar'},
    ];
    let doc = await documenter({
      //Schema name + content
      schemas,
    });

    // testing tarball exists
    assert.ok(doc.tarball);
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