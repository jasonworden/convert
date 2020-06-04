const _ = require('lodash');
const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');
const Bluebird = require('bluebird');
const { format } = require('date-fns');
const File = require('./file.js');
const DirCreator = require('./dir-creator.js');

const CONCURRENCY = 1;

class VideoConverter {
  constructor(inputFileExts = ['mkv'], outputFileExt = 'mov') {
    this.inputFileExts = inputFileExts;
    this.fileExt = outputFileExt;;
  }

  async convertFile(filePath, dstDir = path.dirname(filePath)) {
    const srcExt = filePath.split('.').pop();
    const dstFilename = `${path.basename(filePath, `.${srcExt}`)}.${this.fileExt}`;
    const dstPath = path.join(dstDir, dstFilename);
    return new Promise((resolve, reject) => {
      console.log(`Converting ${filePath}`);
      const conversion = childProcess.spawn('ffmpeg', [
        '-i',
        filePath,
        // '-c:v','v210',
        '-c:a', 'copy',
        dstPath,
      ]);
      conversion.stdout.on('data', (data) => console.log(data.toString()));
      conversion.stderr.on('data', (data) => console.log(data.toString()));

      conversion.on('exit', (code, signal) => {
        if (code === 0) {
          console.log(`finished ${filePath}`);
          resolve({ dstPath, code, signal, srcPath: filePath });
        } else {
          console.error(`ffmpeg error -- code ${code}; signal ${signal}`);
          reject(new Error(`code ${code}; signal ${signal}`));
        }
      });

      conversion.on('error', (code, signal) => reject(new Error(`code ${code}; signal ${signal}`)));
    });
  }

  isInput(filePath) {
    return this.inputFileExts.includes(filePath.split('.').pop());
  }

  async convertRecursive(srcDir, dstDir = DirCreator.suffixedDir(srcDir, this.fileExt)) {
    const contentNames = fs.readdirSync(srcDir);
    const childInfos = contentNames
    // filter out hidden:
    .filter(item => !(/(^|\/)\.[^\/\.]/g).test(item))
    .map((childName) => {
      const childPath = path.join(srcDir, childName);
      return { path: childPath, stats: fs.statSync(childPath) };
    });
    const fileInfos = childInfos.filter((info) => info.stats.isFile());
    const dirInfos = childInfos.filter((info) => info.stats.isDirectory());

    const flacPaths = fileInfos
    .filter((info) => this.isInput(info.path))
    .map((info) => info.path);

    const otherFilepaths = fileInfos
    .filter((info) => !this.isInput(info.path))
    .map((info) => info.path);

    otherFilepaths.forEach((filepath) => {
      const dst = path.join(dstDir, path.basename(filepath));
      console.log(`copying to ${dst}`);
      fs.copyFileSync(filepath, dst);
    });

    const files = await Bluebird.map(flacPaths, async (filepath) => this.convertFile(filepath, dstDir), { concurrency: CONCURRENCY });

    await Bluebird.map(dirInfos, async (info) => {
      const dst = path.resolve(dstDir, path.basename(info.path));
      fs.mkdirSync(dst);
      return this.convertRecursive(info.path, dst);
    }, { concurrency: CONCURRENCY });

    return { dstDir, files };
  }
}

module.exports = VideoConverter;
