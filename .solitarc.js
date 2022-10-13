const path = require("path");
const programDir = path.join(__dirname, "programs/fragmentor");
const idlDir = path.join(__dirname, "target", "idl");
const sdkDir = path.join(__dirname, "js", "src", "generated");
const binaryInstallDir = path.join(__dirname, ".crates");

module.exports = {
  idlGenerator: "anchor",
  programName: "fragmentor",
  programId: "CdYdVmD7bDbr2CfSHDhY5HP51ZV8weQsQBQgXiVzAyed",
  idlDir,
  sdkDir,
  binaryInstallDir,
  programDir,
};
