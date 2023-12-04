const crypto = require('crypto')

function sha256(input) {
  const hash = crypto.createHash('sha256')
  hash.update(input)
  return hash.digest('hex')
}

// snake case 
const bufferInstruction = Buffer.from(sha256('global:fragment'), 'hex')

// camel case
const bufferAccount = Buffer.from(sha256('account:Vault'), 'hex')

const decimalValues = {
  instr: [...bufferInstruction.subarray(0, 8)],
  acc: [...bufferAccount.subarray(0, 8)],
}

console.log(decimalValues)
