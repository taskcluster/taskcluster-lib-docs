let tar = require('tar-stream');
let _ = require('lodash');
let assert = require('assert');
let fs = require('mz/fs');
let path = require('path');
let recursiveReadSync = require('recursive-readdir-sync');
let zlib = require('zlib');

async function documenter(options) {
  options = _.defaults({}, options, {
    metadata: null,
    schemas: [],
    docsFolder: null,
    references: [],
  });
  assert(options.schemas, 'options.schemas must be given');
  assert(options.schemas instanceof Array, 'options.schemas must be an array');

  let tarball = tar.pack();
  let metadata = options.metadata;

  if (metadata) {
    let data = JSON.stringify(metadata, null, 2);
    tarball.entry({name: 'metadata.json'}, data);
  }

  let schemas = options.schemas;
  schemas.forEach(schema => {
    let data = JSON.stringify(schema, null, 2);
    let schemaFilename = Object.keys(schema)[0];
    tarball.entry({name: 'schema/' + schemaFilename}, data);
  });

  let references = options.references;
  references.forEach(reference => {
    let data = JSON.stringify(reference, null, 2);
    tarball.entry({name: 'references/' + reference.name + '.json'}, data);
  });

  if (options.docsFolder !== null) {
    let docs = options.docsFolder;
    let files = recursiveReadSync(options.docsFolder);

    await Promise.all(files.map(async (file) => {
      let relativePath = path.basename(file);
      let data = await fs.readFile(file, {encoding: 'utf8'});
      tarball.entry({name: 'docs/' + relativePath}, data);
    }));
  }
  // the stream was added
  // no more entries
  tarball.finalize();

  let gzip = zlib.createGzip();
  let tgz = tarball.pipe(gzip);

  let output = {
    tgz,
  };

  return output;
}

module.exports = documenter;
