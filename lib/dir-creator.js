const _ = require('lodash');
const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');
const Bluebird = require('bluebird');
const { format } = require('date-fns');
const isImage = require('is-image');

class DirCreator {
  static suffixedDir(_srcDir, encoding) {
    const srcDir = path.resolve(_srcDir);
    if (!fs.existsSync(srcDir)) {
      throw Error(`Directory ${srcDir} does not exist (received argument: "${_srcDir}")`);
    }
    const dstDirName = File.suffixedDirName(srcDir, encoding);
    const dstDir = path.resolve(srcDir, '..', dstDirName);

    console.log('destination:', dstDir);

    if (!fs.existsSync(dstDir)) {
      fs.mkdirSync(dstDir);
    }

    return dstDir;
  }

  static suffixedDir(_srcDir, encoding) {
    const srcDir = path.resolve(_srcDir);
    if (!fs.existsSync(srcDir)) {
      throw Error(`Directory ${srcDir} does not exist (received argument: "${_srcDir}")`);
    }
    const dstDirName = DirCreator.suffixedDirName(srcDir, encoding);
    const dstDir = path.resolve(srcDir, '..', dstDirName);

    console.log('destination:', dstDir);

    if (!fs.existsSync(dstDir)) {
      fs.mkdirSync(dstDir);
    }

    return dstDir;
  }

  static suffixedDirName(srcDir, encoding) {
    return [
      _.last(srcDir.split(path.sep)),
      format(new Date(), 'yyyy-MM-dd__hh-mm-ss'),
      `flac_to_${encoding}`,
    ].join('__');
  }
}

module.exports = DirCreator;
