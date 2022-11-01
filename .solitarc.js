const path = require("path");
const programDir = path.join(__dirname, "programs/fragmentor");
const idlDir = path.join(__dirname, "target", "idl");
const sdkDir = path.join(__dirname, "js", "src", "generated");
const binaryInstallDir = path.join(__dirname, ".crates");

module.exports = {
  idlGenerator: "anchor",
  programName: "fragmentor",
  programId: "FRAGFu59MRwy5KeEMnbzsUPa2JkwLVsaP7WbhF2r2Yh",
  idlDir,
  sdkDir,
  binaryInstallDir,
  programDir,
};
