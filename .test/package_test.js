'use strict';

suite('Package', function () {
  var assert = require('assert');
  var pack = require('../package.json');
  var exec = require('child_process');

  test('git tag must match package version', function () {
    var tag = exec.execSync('git tag -l --contains HEAD').toString().trim();
    if (tag === '') {
      console.log('    No git tag, no need to check tag!');
      this.skip();
    }
    assert.equal('v' + pack.version, tag);
  });
});
//# sourceMappingURL=package_test.js.map
