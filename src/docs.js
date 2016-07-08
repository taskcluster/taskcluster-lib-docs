let tar = require('tar-stream');
let _ = require('lodash');
let assert = require('assert');
let fs = require('mz/fs');
let path = require('path');
let recursiveReadSync = require('recursive-readdir-sync');

async function documenter(options) {

  options = _.defaults({}, options, {
    schemas: [],
    docsFolder: null,
  });
  assert(options.schemas, 'options.schemas must be given');
  assert(options.schemas instanceof Array, 'options.schemas must be an array');

  let schemas = options.schemas;
  let tarball = tar.pack();

  // add schemas to tarball
  schemas.forEach(schema => {
    let data = JSON.stringify(schema, null, 2);
    tarball.entry({name: 'schema/' + schema.id}, data);
  });

  // add docs to tarball
  let docs = options.docsFolder;
  let files = recursiveReadSync(options.docsFolder);

  await Promise.all(files.map(file => {
    //remove the path
    let relativePath = file.replace(`${options.docsFolder}/`, '');
    let fileReadPromise = new Promise(function(fulfill, reject) {
      fs.readFile(file, 'utf8', (err, data) => {
        if (err) {
          reject(err);
        } else {
          tarball.entry({name: 'docs/' + relativePath}, data);
          fulfill();
        }
      });
    });
    return fileReadPromise;
  }));

  tarball.finalize();

  let output = {
    tarball,
  };
  return output;
}

module.exports = documenter;
