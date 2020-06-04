const Bluebird = require('bluebird');
const VideoConverter = require('./lib/video-converter.js');
const childProcess = require('child_process');
const commandLineArgs = require('command-line-args');

const OPTION_DEFINITIONS = [
  { name: 'directory', alias: 'd', type: String },
  { name: 'inputExt', alias: 'i', type: String, defaultValue: 'mkv' },
  { name: 'outputExt', alias: 'o', type: String, defaultValue: 'mov' },
];

const options = commandLineArgs(OPTION_DEFINITIONS);
console.log('options:');
console.dir(options);

const converter = new VideoConverter([options.inputExt], options.outputExt);

const run = async () => {
  const { dstDir } = await converter.convertRecursive(options.directory);
  // console.log(`Successfully converted ${files.length} files:`);
  // console.dir(files);
  console.log(`opening ${dstDir} in Finder...`);
  childProcess.spawnSync('open', [dstDir]);
};

Bluebird.resolve(run())
.catch(console.error)
.finally(() => {
  console.log('exiting...');
  // process.exit(0);
});
