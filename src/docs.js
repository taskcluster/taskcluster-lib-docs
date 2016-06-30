let tar = require('tar-stream');

async function documenter(options = {}) {
  // print schemas
  console.log(options.schemas);

  // take schemas(name + content) + add it to stream tarball
  // pack is a streams2 stream
  let tarball = tar.pack();

  let schemas = options.schemas;

  if (schemas) {
    for (let schema of schemas) {
      tarball.entry({name: schema.name}, schema.content);
    }
  }
  tarball.finalize();

  let output = {
    tarball,
  };

  return output;

  // add docs to tarball
  // everythg in reference (api + exchanges) + add it to tarball
  // generator metadata.json > add it to tarball

  // upload tarball to S3
  // Add a utility function that can be used to get all of the
  // schemas that have been loaded.
}

module.exports = documenter;
