const path = require("path");
const programDir = path.join(__dirname, "programs/fragmentor");
const idlDir = path.join(__dirname, "target", "idl");
const sdkDir = path.join(__dirname, "fragmentor-sdk", "src", "generated");
const binaryInstallDir = path.join(__dirname, ".crates");

module.exports = {
  idlGenerator: "anchor",
  programName: "fragmentor",
  programId: "9SPvLNP6TAW4ZCtST8pmCCrKYt2gctRedmq1eWAu2Cwz",
  idlDir,
  sdkDir,
  binaryInstallDir,
  programDir,
};
