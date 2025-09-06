// Base Account Factory ABI for creating smart contract accounts
export const BASE_ACCOUNT_FACTORY_ABI = [
  {
    "inputs": [
      {"name": "owner", "type": "address"},
      {"name": "salt", "type": "uint256"}
    ],
    "name": "createAccount",
    "outputs": [{"name": "ret", "type": "address"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "owner", "type": "address"},
      {"name": "salt", "type": "uint256"}
    ],
    "name": "getAddress",
    "outputs": [{"name": "ret", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "account", "type": "address"}],
    "name": "isDeployed",
    "outputs": [{"name": "ret", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;
