// Base Account (Smart Contract Account) ABI
export const BASE_ACCOUNT_ABI = [
  {
    "inputs": [
      {"name": "dest", "type": "address"},
      {"name": "value", "type": "uint256"},
      {"name": "func", "type": "bytes"}
    ],
    "name": "execute",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "dest", "type": "address[]"},
      {"name": "value", "type": "uint256[]"},
      {"name": "func", "type": "bytes[]"}
    ],
    "name": "executeBatch",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getNonce",
    "outputs": [{"name": "nonce", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{"name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "entryPoint",
    "outputs": [{"name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;
