const Bluebird = require('bluebird');
const FlacConverter = require('./lib/converter.js');
const childProcess = require('child_process');
const commandLineArgs = require('command-line-args');

const OPTION_DEFINITIONS = [
  { name: 'directory', alias: 'd', type: String },
  { name: 'encoding', alias: 'e', type: String, defaultValue: 'aac' },
  // { name: 'itunes-library-to-add-to', alias: 'i', type: String },
];

const options = commandLineArgs(OPTION_DEFINITIONS);
console.log('options:');
console.dir(options);

const converter = new FlacConverter({ encoding: options.encoding });

const run = async () => {
  const { dstDir } = await converter.convertParentDirectory(options.directory);
  // console.log(`Successfully converted ${files.length} files:`);
  // console.dir(files);
  // console.log(`opening ${dstDir} in Finder...`);
  // childProcess.execSync(`open ${dstDir}`);
  childProcess.spawnSync('open', [dstDir]);
};

Bluebird.resolve(run())
.catch(console.error)
.finally(() => {
  console.log('exiting...');
  // process.exit(0);
});
