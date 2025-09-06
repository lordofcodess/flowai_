// EntryPoint ABI for ERC-4337 account abstraction
export const ENTRY_POINT_ABI = [
  {
    "inputs": [
      {
        "components": [
          {"name": "sender", "type": "address"},
          {"name": "nonce", "type": "uint256"},
          {"name": "initCode", "type": "bytes"},
          {"name": "callData", "type": "bytes"},
          {"name": "callGasLimit", "type": "uint256"},
          {"name": "verificationGasLimit", "type": "uint256"},
          {"name": "preVerificationGas", "type": "uint256"},
          {"name": "maxFeePerGas", "type": "uint256"},
          {"name": "maxPriorityFeePerGas", "type": "uint256"},
          {"name": "paymasterAndData", "type": "bytes"},
          {"name": "signature", "type": "bytes"}
        ],
        "name": "userOp",
        "type": "tuple"
      }
    ],
    "name": "handleOps",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
          {"name": "sender", "type": "address"},
          {"name": "nonce", "type": "uint256"},
          {"name": "initCode", "type": "bytes"},
          {"name": "callData", "type": "bytes"},
          {"name": "callGasLimit", "type": "uint256"},
          {"name": "verificationGasLimit", "type": "uint256"},
          {"name": "preVerificationGas", "type": "uint256"},
          {"name": "maxFeePerGas", "type": "uint256"},
          {"name": "maxPriorityFeePerGas", "type": "uint256"},
          {"name": "paymasterAndData", "type": "bytes"},
          {"name": "signature", "type": "bytes"}
        ],
        "name": "userOp",
        "type": "tuple"
      },
      {"name": "beneficiary", "type": "address"}
    ],
    "name": "handleOp",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "account", "type": "address"}],
    "name": "getNonce",
    "outputs": [{"name": "nonce", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "deposit", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;
