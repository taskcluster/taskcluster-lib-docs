'use strict';

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

suite('End to End', function () {
  var getObjectsInStream = function () {
    var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(inStream) {
      var output, extractor, downloadPromise;
      return _regenerator2.default.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              output = {};
              extractor = tar.extract();
              downloadPromise = new _promise2.default(function (resolve, reject) {
                extractor.on('entry', function (header, stream, callback) {
                  var data = [];

                  stream.on('data', function (chunk) {
                    data.push(chunk);
                  });

                  stream.on('end', function () {
                    output[header.name] = data.join('');
                    callback(); //ready for next entry
                  });

                  stream.resume(); //just auto drain the stream
                });

                extractor.on('finish', function () {
                  // all entries read
                  resolve();
                });

                extractor.on('error', function () {
                  reject();
                });
              });

              inStream.pipe(extractor);
              _context2.next = 6;
              return downloadPromise;

            case 6:
              return _context2.abrupt('return', output);

            case 7:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, this);
    }));

    return function getObjectsInStream(_x) {
      return _ref2.apply(this, arguments);
    };
  }();

  var assert = require('assert');

  var _require = require('../'),
      documenter = _require.documenter,
      downloader = _require.downloader;

  var debug = require('debug')('test');
  var _ = require('lodash');
  var tar = require('tar-stream');
  var rootdir = require('app-root-dir');
  var zlib = require('zlib');
  var validator = require('taskcluster-lib-validate');
  var config = require('typed-env-config');
  var API = require('taskcluster-lib-api');
  var Exchanges = require('pulse-publisher');

  var awsMock = require('aws-sdk-mock');
  var mockS3UploadStream = require('./mockS3UploadStream');

  var validate = null;
  var api = null;
  var exchanges = null;
  var references = null;
  var cfg = config({});
  var credentials = cfg.taskcluster.credentials;
  var tier = 'core';

  suiteSetup((0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee() {
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return validator({
              folder: './test/schemas',
              baseUrl: 'http://localhost:1203/',
              constants: { 'my-constant': 42 }
            });

          case 2:
            validate = _context.sent;

            api = new API({
              title: 'Testing Stuff',
              description: 'This is for testing stuff!'
            });
            exchanges = new Exchanges({
              title: 'Testing Stuff Again',
              description: 'Another test!'
            });
            references = [{ name: 'api', reference: api.reference({ baseUrl: 'http://localhost' }) }, { name: 'events', reference: exchanges.reference({ baseUrl: 'http://localhost' }) }];

          case 6:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined);
  })));

  function assertInTarball(shoulds, tarball) {
    shoulds.push('metadata.json');
    shoulds.push('README.md');
    var contains = [];
    var extractor = tar.extract();
    extractor.on('entry', function (header, stream, callback) {
      stream.on('end', function () {
        contains.push(header.name);
        callback(); // ready for next entry
      });
      stream.resume(); // just auto drain the stream
    });

    return new _promise2.default(function (resolve, reject) {
      extractor.on('finish', function () {
        try {
          assert.deepEqual(contains.sort(), shoulds.sort());
        } catch (e) {
          reject(e);
        }
        resolve();
      });

      tarball.pipe(zlib.Unzip()).pipe(extractor);
    });
  }

  test('tarball exists', (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3() {
    var doc;
    return _regenerator2.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.next = 2;
            return documenter({
              schemas: validate.schemas,
              tier: tier
            });

          case 2:
            doc = _context3.sent;

            assert.ok(doc.tgz);

          case 4:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, this);
  })));

  test('tarball is empty but exists', function () {
    var doc = documenter({
      tier: tier
    });
    assert.equal(doc.tgz, null);
  });

  test('test publish tarball', (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee4() {
    var tempCreds, doc;
    return _regenerator2.default.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:

            //Setting fake credentials to bypass Taskcluster authentication.
            tempCreds = null;


            if (!credentials.clientId) {
              tempCreds = { clientId: 'bypassTcCreds', accessToken: '123456' };
            }

            _context4.next = 4;
            return documenter({
              project: 'docs-testing',
              schemas: validate.schemas,
              tier: tier,
              credentials: tempCreds || credentials,
              docsFolder: './test/docs/',
              references: references,
              bucket: cfg.bucket,
              publish: true,
              module: mockS3UploadStream
            });

          case 4:
            doc = _context4.sent;

            assert.ok(doc.tgz);

          case 6:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, this);
  })));

  test('tarball contains docs and metadata', (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee5() {
    var doc, shoulds;
    return _regenerator2.default.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            _context5.next = 2;
            return documenter({
              docsFolder: './test/docs',
              tier: tier
            });

          case 2:
            doc = _context5.sent;
            shoulds = ['docs/example.md', 'docs/nested/nested-example.md'];
            return _context5.abrupt('return', assertInTarball(shoulds, doc.tgz));

          case 5:
          case 'end':
            return _context5.stop();
        }
      }
    }, _callee5, this);
  })));

  test('tarball contains schemas and metadata', (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee6() {
    var doc, shoulds;
    return _regenerator2.default.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            _context6.next = 2;
            return documenter({
              schemas: validate.schemas,
              tier: tier
            });

          case 2:
            doc = _context6.sent;
            shoulds = ['schemas/foo.json', 'schemas/bar.json', 'docs/documenting-non-services.md', 'docs/format.md'];
            return _context6.abrupt('return', assertInTarball(shoulds, doc.tgz));

          case 5:
          case 'end':
            return _context6.stop();
        }
      }
    }, _callee6, this);
  })));

  test('tarball contains references and metadata', (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee7() {
    var doc, shoulds;
    return _regenerator2.default.wrap(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            _context7.next = 2;
            return documenter({
              references: references,
              tier: tier
            });

          case 2:
            doc = _context7.sent;
            shoulds = ['references/api.json', 'references/events.json', 'docs/documenting-non-services.md', 'docs/format.md'];
            return _context7.abrupt('return', assertInTarball(shoulds, doc.tgz));

          case 5:
          case 'end':
            return _context7.stop();
        }
      }
    }, _callee7, this);
  })));

  test('tarball contains only metadata', (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee8() {
    var doc, shoulds;
    return _regenerator2.default.wrap(function _callee8$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:
            _context8.next = 2;
            return documenter({
              tier: tier
            });

          case 2:
            doc = _context8.sent;
            shoulds = ['docs/documenting-non-services.md', 'docs/format.md'];
            return _context8.abrupt('return', assertInTarball(shoulds, doc.tgz));

          case 5:
          case 'end':
            return _context8.stop();
        }
      }
    }, _callee8, this);
  })));

  test('download tarball contains project', (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee9() {
    var stream, files, shoulds, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, should;

    return _regenerator2.default.wrap(function _callee9$(_context9) {
      while (1) {
        switch (_context9.prev = _context9.next) {
          case 0:
            if (!credentials.clientId) {
              this.skip();
            }

            _context9.next = 3;
            return downloader({
              project: 'docs-testing',
              bucket: cfg.bucket,
              credentials: credentials
            });

          case 3:
            stream = _context9.sent;
            _context9.next = 6;
            return getObjectsInStream(stream);

          case 6:
            files = _context9.sent;
            shoulds = ['metadata.json'];
            _iteratorNormalCompletion = true;
            _didIteratorError = false;
            _iteratorError = undefined;
            _context9.prev = 11;


            for (_iterator = (0, _getIterator3.default)(shoulds); !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
              should = _step.value;

              assert.ok(files[should]);
            }
            _context9.next = 19;
            break;

          case 15:
            _context9.prev = 15;
            _context9.t0 = _context9['catch'](11);
            _didIteratorError = true;
            _iteratorError = _context9.t0;

          case 19:
            _context9.prev = 19;
            _context9.prev = 20;

            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }

          case 22:
            _context9.prev = 22;

            if (!_didIteratorError) {
              _context9.next = 25;
              break;
            }

            throw _iteratorError;

          case 25:
            return _context9.finish(22);

          case 26:
            return _context9.finish(19);

          case 27:
          case 'end':
            return _context9.stop();
        }
      }
    }, _callee9, this, [[11, 15, 19, 27], [20,, 22, 26]]);
  })));
});
//# sourceMappingURL=main_test.js.map
