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
}

module.exports = File;
