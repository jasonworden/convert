const _ = require('lodash');
const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');
const Bluebird = require('bluebird');
const { format } = require('date-fns');
const File = require('./file.js');

const ENCODING_AAC = 'aac';
const ENCODING_MP3 = 'mp3';

const CONCURRENCY = 2;

const BIT_RATE_BY_ENCODING = {
  [ENCODING_AAC]: 256,
  [ENCODING_MP3]: 320,
};

const EXT_BY_ENCODING = {
  [ENCODING_AAC]: 'm4a',
  [ENCODING_MP3]: 'mp3',
};

const ENCODING_ARGS_BY_ENCODING = {
  [ENCODING_AAC]: [
    // see https://stackoverflow.com/a/55108365 to install this lib with ffmpeg using brew:
    '-c:a', 'libfdk_aac',
    '-c:v', 'copy',
  ],
  [ENCODING_MP3]: [
    '-c:v', 'copy',
  ],
};

class FlacConverter {
  constructor({ encoding = ENCODING_MP3 }) {
    this.encoding = encoding;
    this.fileExt = EXT_BY_ENCODING[this.encoding];
    this.bitRate = BIT_RATE_BY_ENCODING[this.encoding];
    this.encodingArgs = ENCODING_ARGS_BY_ENCODING[this.encoding];
  }

  async convertFile(filePath, dstDir = path.dirname(filePath)) {
    const dstFilename = path.basename(filePath).replace(/.flac$/i, `.${this.fileExt}`);
    const dstPath = path.join(dstDir, dstFilename);
    return new Promise((resolve, reject) => {
      console.log(`Converting ${filePath}`);
      const conversion = childProcess.spawn('ffmpeg', [
        '-i',
        filePath,
        '-loglevel', 'error',
        '-ab', `${this.bitRate}k`,
        ...this.encodingArgs,
        '-map_metadata', '0',
        '-id3v2_version',
        '3',
        '-y',
        dstPath,
      ]);

      conversion.stdout.on('data', (data) => {
        console.log('test stdout:', data.toString());
      });

      conversion.stderr.on('data', (data) => {
        console.log('test stderr:', data.toString());
      });

      conversion.on('exit', (code, signal) => {
        if (code === 0) {
          resolve({ dstPath, code, signal, srcPath: filePath });
        } else {
          reject(new Error(`code ${code}; signal ${signal}`));
        }
      });

      conversion.on('error', (code, signal) => reject(new Error(`code ${code}; signal ${signal}`)));
    });
  }

  async convertParentDirectory(parentDir) {
    const contentNames = fs.readdirSync(parentDir);
    const childInfos = contentNames.map((childName) => {
      const childPath = path.join(parentDir, childName);
      return { path: childPath, stats: fs.statSync(childPath) };
    });
    const fileInfos = childInfos.filter((info) => info.stats.isFile() && File.isFlac(info.path));
    const dirInfos = childInfos.filter((info) => info.stats.isDirectory());

    const dstParentDir = File.createSuffixedDir(parentDir, this.encoding);

    const convertedFiles = await Bluebird.map(fileInfos, async (info) => this.convertFile(info.path, dstParentDir));
    const convertedDirs = await Bluebird.map(dirInfos, async (info) => {
      const dstDirName = path.basename(info.path);
      const dstDir = path.join(dstParentDir, dstDirName);
      if (!fs.existsSync(dstDir)) {
        fs.mkdirSync(dstDir);
      }
      return this.convertDirectory(info.path, dstDir, parentDir, dstParentDir);
    });

    return { dstDir: dstParentDir };
  }

  // async convertBaseRecursive(baseDir) {
  //   const dstDir = File.createSuffixedDir(baseDir, this.encoding);
  //
  //   const convertedFiles = await Bluebird.map(fileInfos, async (info) => this.convertFile(info.path, dstParentDir));
  //   const convertedDirs = await Bluebird.map(dirInfos, async (info) => {
  //     const dstDirName = path.basename(info.path);
  //     const dstDir = path.join(dstParentDir, dstDirName);
  //     if (!fs.existsSync(dstDir)) {
  //       fs.mkdirSync(dstDir);
  //     }
  //     return this.convertDirectory(info.path, dstDir, parentDir, dstParentDir);
  //   });
  //
  //   return { dstDir: dstParentDir };
  // }

  async convertRecursive(srcDir, dstDir = File.createSuffixedDir(srcDir, this.encoding)) {
    const contentNames = fs.readdirSync(srcDir);
    const childInfos = contentNames.map((childName) => {
      const childPath = path.join(srcDir, childName);
      return { path: childPath, stats: fs.statSync(childPath) };
    });
    const fileInfos = childInfos.filter((info) => info.stats.isFile());
    const dirInfos = childInfos.filter((info) => info.stats.isDirectory());

    const flacPaths = fileInfos
    .filter((info) => File.isFlac(info.path))
    .map((info) => info.path);

    const otherFilepaths = fileInfos
    .filter((info) => !File.isFlac(info.path))
    .map((info) => info.path);

    otherFilepaths.forEach((filepath) => {
      const dst = path.join(dstDir, path.basename(filepath));
      console.log('copying non-flac file to', dst);
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

  async convertDirectoryFlat(srcDir, dstDir = File.createSuffixedDir(srcDir, this.encoding)) {
    const filenames = fs.readdirSync(srcDir);

    const flacPaths = filenames
    .filter((filename) => File.isFlac(filename))
    .map((filename) => path.join(srcDir, filename));

    const otherPaths = filenames
    .filter((filename) => !File.isFlac(filename))
    .map((filename) => path.join(srcDir, filename));

    otherPaths.forEach((imagePath) => {
      const dst = path.join(dstDir, path.basename(imagePath));
      fs.copyFileSync(imagePath, dst);
    });

    const files = await Bluebird.map(flacPaths, async (filepath) => this.convertFile(filepath, dstDir));

    // console.log('will copy to itunes...');
    // childProcess.execSync(`cp -r ${dstDir} "/Users/jason/Music/iTunes/iTunes Media/Automatically Add to iTunes.localized"`)
    // console.log('added to iTunes!');
    return { dstDir, files };
  }
}

module.exports = FlacConverter;
