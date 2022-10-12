const path = require('path');
const programDir = path.join(__dirname, 'programs/fragmentor');
const idlDir = path.join(__dirname, "target",'idl');
const sdkDir = path.join(__dirname, 'src', 'generated');
const binaryInstallDir = path.join(__dirname, '.crates');

module.exports = {
  idlGenerator: 'anchor',
  programName: 'fragmentor',
  programId: '6jZDraLYUeT7Gau1Y4CEf8GPdbquacMEDJ6nZKYX6Q4m',
  idlDir,
  sdkDir,
  binaryInstallDir,
  programDir,
};