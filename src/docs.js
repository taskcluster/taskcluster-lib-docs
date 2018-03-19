let tar = require('tar-stream');
let _ = require('lodash');
let assert = require('assert');
let fs = require('mz/fs');
let path = require('path');
let recursiveReadSync = require('recursive-readdir-sync');
let zlib = require('zlib');
let rootdir = require('app-root-dir');
let aws = require('aws-sdk');

let client = require('taskcluster-client');
let S3UploadStream = require('s3-upload-stream');
let debug = require('debug')('taskcluster-lib-docs');

async function documenter(options) {
  options = _.defaults({}, options, {
    referenceUrl: 'https://docs.taskcluster.net/reference/',
    aws: null,
    credentials: undefined,
    project: null,
    tier: null,
    schemas: {},
    menuIndex: 10,
    readme: path.join(rootdir.get(), 'README.md'),
    docsFolder: path.join(rootdir.get(), '/docs'),
    bucket: 'taskcluster-raw-docs',
    references: [],
    publish: process.env.NODE_ENV == 'production',
  });
  
  const rv = new Documenter(options);
  if (options.publish) {
    console.log(rv);
    await rv.publish();
  }
  return rv;
}

const TIERS = [
  'core',
  'platform',
  'integrations',
  'operations',
  'libraries',
  'workers',
];

class Documenter {
  constructor(options) {
    assert(options.schemas, 'options.schemas must be given');
    assert(options.tier, 'options.tier must be given');
    assert(TIERS.indexOf(options.tier) !== -1,
      `options.tier must be one of ${TIERS.join(', ')}`
    );

    if (!options.project) {
      let pack = require(path.join(rootdir.get(), 'package.json'));
      options.project = pack.name;
    }
    delete options.publish;
    Object.assign(this, options);
  }

  /**
   * Get the URL for documentation for this service; used in error messages.
   */
  get documentationUrl() {
    return this.referenceUrl + this.tier + '/' + this.project;
  }

  /**
   * Generate a stream containing a tarball with all of the associated metadata.
   * This is mostly to support the "old way", and when nothing uses the old way
   * anymore this can be adapted to write data directly to DOCS_OUTPUT_DIR.
   *
   * Note that this is a zlib-compressed tarball.
   */
  async _tarballStream() {
    function headers(name, dir) {
      return {name: path.join(dir || '', name)};
    }

    let tarball = tar.pack();

    let metadata = {
      version: 1,
      project: this.project,
      tier: this.tier,
      menuIndex: this.menuIndex,
    };

    tarball.entry(
      headers('metadata.json'),
      JSON.stringify(metadata, null, 2)
    );

    _.forEach(this.schemas, (schema, name) => tarball.entry(
      headers(name, 'schemas'),
      schema
    ));

    _.forEach(this.references, reference => tarball.entry(
      headers(reference.name + '.json', 'references'),
      JSON.stringify(reference.reference, null, 2)
    ));

    try {
      tarball.entry(
        headers('README.md'),
        await fs.readFile(this.readme)
      );
    } catch (err) {
      if (err.code !== 'ENOENT') {
        throw err;
      }
      debug('README.md does not exist. Continuing.');
    }

    try {
      await Promise.all(recursiveReadSync(this.docsFolder).map(async file => {
        let relativePath = path.relative(this.docsFolder, file);
        tarball.entry(headers(relativePath, 'docs'), await fs.readFile(file, {encoding: 'utf8'}));
      }));
    } catch (err) {
      if (err.code !== 'ENOENT') {
        throw err;
      }
      debug('Docs folder does not exist. Continuing.');
    }

    tarball.finalize();
    return tarball.pipe(zlib.createGzip());
  }

  /**
   * Publish the tarball to S3 (the old way).
   *
   * This is called automatically if options.publish is true.
   */
  async publish() {
    let tgz = this._tarballStream();

    let creds = this.aws;
    if (!creds) {
      let auth = new client.Auth({
        credentials: this.credentials,
        baseUrl: this.authBaseUrl,
      });

      creds = await auth.awsS3Credentials('read-write', this.bucket, this.project + '/');
    }

    let s3 = new aws.S3(creds.credentials);
    let s3Stream = (this.S3UploadStream || S3UploadStream)(s3);

    let upload = s3Stream.upload({
      Bucket: this.bucket,
      Key: this.project + '/latest.tar.gz',
    });

    // handle progress
    upload.on('part', function(details) {
      debug(details);
    });

    let uploadPromise = new Promise((resolve, reject) => {
      // handle upload completion
      upload.on('uploaded', function(details) {
        debug(details);
        resolve(details);
      });

      // handle errors
      upload.on('error', function(error) {
        console.log(error.stack);
        reject(error);
      });
    });

    // pipe the incoming filestream through compression and up to s3
    tgz.pipe(upload);
    await uploadPromise;
  }
}

async function downloader(options) {
  options = _.defaults({}, options, {
    credentials: {},
    bucket: 'taskcluster-raw-docs',
    project: null,
  });

  let auth = new client.Auth({
    credentials: options.credentials,
  });

  let s3;
  if (options._s3) {
    s3 = options._s3;
  } else {
    let creds = await auth.awsS3Credentials('read-only', options.bucket, options.project + '/');
    s3 = new aws.S3(creds.credentials);
  }

  let readStream = s3.getObject({
    Bucket: options.bucket,
    Key: options.project + '/latest.tar.gz',
  }).createReadStream();

  return readStream.pipe(zlib.Unzip());
}

// Export documenter as top-level function, it's the only thing used by most
// people importing this library.
documenter.downloader = downloader;
documenter.documenter = documenter; // For backwards compatibility
module.exports = documenter;
