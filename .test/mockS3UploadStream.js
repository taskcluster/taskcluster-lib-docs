'use strict';

var Writable = require('stream').Writable;

function MockClient(client) {
  if (this instanceof MockClient === false) {
    return new MockClient(client);
  }
}

MockClient.prototype.upload = function (obj) {

  var stream = new Writable();

  stream._write = function (chunk, encoding, done) {
    stream.emit('part', 'Fake upload for testing purposes is in progress');
    if (!chunk) {
      stream.emit('error', 'Nothing in is being piped in the stream');
    }
    done();
  };

  stream.end = function (chunk, encoding, done) {
    stream.emit('uploaded', 'Fake upload for testing purposes is done');
  };

  return stream;
};

module.exports = MockClient;
//# sourceMappingURL=mockS3UploadStream.js.map
