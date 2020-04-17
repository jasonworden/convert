const _ = require('lodash');
const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');
const Bluebird = require('bluebird');
const { format } = require('date-fns');
const isImage = require('is-image');

class File {
  static isFlac(fileNameOrPath) {
    return /.*[.](flac)$/gim.test(fileNameOrPath);
  }

  static isImage(filepath) {
    return isImage(filepath);
  }

  static createSuffixedDir(_srcDir, encoding) {
    const srcDir = path.resolve(_srcDir);
    if (!fs.existsSync(srcDir)) {
      throw Error(`Directory ${srcDir} does not exist (received argument: "${_srcDir}")`);
    }
    const dstDirName = File.createSuffixedDirName(srcDir, encoding);
    const dstDir = path.resolve(srcDir, '..', dstDirName);

    console.log('destination:', dstDir);

    if (!fs.existsSync(dstDir)) {
      fs.mkdirSync(dstDir);
    }

    return dstDir;
  }

  static createSuffixedDir(_srcDir, encoding) {
    const srcDir = path.resolve(_srcDir);
    if (!fs.existsSync(srcDir)) {
      throw Error(`Directory ${srcDir} does not exist (received argument: "${_srcDir}")`);
    }
    const dstDirName = File.createSuffixedDirName(srcDir, encoding);
    const dstDir = path.resolve(srcDir, '..', dstDirName);

    console.log('destination:', dstDir);

    if (!fs.existsSync(dstDir)) {
      fs.mkdirSync(dstDir);
    }

    return dstDir;
  }

  static createSuffixedDirName(srcDir, encoding) {
    return [
      _.last(srcDir.split(path.sep)),
      format(new Date(), 'yyyy-MM-dd__hh-mm-ss'),
      `flac_to_${encoding}`,
    ].join('__');
  }
}

module.exports = File;
