# 🤖 FlowAI Development Scaffold

<h4 align="center">
  <a href="https://docs.scaffoldeth.io">Scaffold-ETH 2 Docs</a> |
  <a href="https://scaffoldeth.io">Scaffold-ETH 2 Website</a>
</h4>

🧪 A development scaffold for building **FlowAI** - an AI-powered on-chain autonomous agents platform that helps you perform blockchain activities using plain English commands. This scaffold provides a complete development environment for building, testing, and deploying AI agents that automate on-chain operations.

⚙️ Built using NextJS, RainbowKit, Hardhat, Wagmi, Viem, and Typescript.

## 🎯 Project Overview

FlowAI is an AI agents platform that helps you perform on-chain activities such as sending money using plain English, resolving ENS addresses, and more. This scaffold provides the development foundation for:

- **🤖 AI-Powered Autonomous Agents**: Create intelligent agents that execute blockchain operations
- **🗣️ Plain English Commands**: Interact with blockchain using natural language
- **🌐 ENS Integration**: Resolve and manage ENS addresses automatically
- **💰 Stablecoin Payments**: Process payments using human-readable commands
- **🔄 On-Chain Automation**: Automate complex blockchain workflows with AI

## 🏗️ Architecture

This scaffold includes:

- **AI Agent Interface**: NextJS application with natural language processing capabilities
- **Blockchain Integration**: Hardhat development environment for smart contract automation
- **ENS Resolution**: Automated ENS address resolution and management
- **Payment Processing**: Stablecoin payment automation with plain English commands
- **Testing**: Comprehensive testing framework for AI agents and blockchain interactions
- **Deployment**: Automated deployment scripts for multiple networks

## 📁 Project Structure

```
flow-scaffold/
├── packages/
│   ├── nextjs/               # AI Agent Interface
│   │   ├── src/              # React components and AI integration
│   │   ├── public/           # Static assets
│   │   └── package.json      # Frontend dependencies
│   └── hardhat/              # Blockchain automation contracts
│       ├── contracts/        # Solidity smart contracts for AI agents
│       ├── deploy/           # Deployment scripts
│       ├── test/             # Contract tests
│       └── package.json      # Hardhat dependencies
├── package.json              # Root workspace configuration
└── README.md                 # This file
```

## 🚀 Quickstart

### Prerequisites

- [Node.js (>= v20.18.3)](https://nodejs.org/en/download/)
- [Yarn](https://yarnpkg.com/getting-started/install) (v1 or v2+)
- [Git](https://git-scm.com/downloads)

### Installation

1. **Install dependencies:**
   ```bash
   cd flow-scaffold
   yarn install
   ```

2. **Start local blockchain:**
   ```bash
   yarn chain
   ```
   This starts a local Ethereum network using Hardhat for development and testing.

3. **Deploy AI agent contracts:**
   ```bash
   yarn deploy
   ```
   Deploys the FlowAI agent contracts to your local network.

4. **Start AI agent interface:**
   ```bash
   yarn start
   ```
   Visit your AI agent platform at: `http://localhost:3000`

## 🧪 Development

### AI Agent Contract Development

- **Edit AI agent contracts** in `packages/hardhat/contracts/`
- **Run tests** with `yarn hardhat:test`
- **Compile contracts** with `yarn hardhat:compile`
- **Deploy to local network** with `yarn deploy`

### AI Agent Interface Development

- **Edit AI interface pages** in `packages/nextjs/src/`
- **Add AI components** in `packages/nextjs/src/components/`
- **Configure AI agent settings** in `packages/nextjs/scaffold.config.ts`

### Testing

- **AI agent contract tests**: `yarn hardhat:test`
- **AI interface tests**: `yarn next:test` (when implemented)
- **Type checking**: `yarn hardhat:check-types` and `yarn next:check-types`

## 🔧 Configuration

### Hardhat Configuration

Customize your AI agent blockchain settings in `packages/hardhat/hardhat.config.ts`:

- Network configurations for AI agents
- Compiler settings
- Plugin configurations
- Environment variables

### NextJS Configuration

Configure your AI agent interface in `packages/nextjs/scaffold.config.ts`:

- AI agent contract addresses
- Network configurations
- AI feature flags
- Interface customizations

## 📚 Documentation

- **Scaffold-ETH 2**: [docs.scaffoldeth.io](https://docs.scaffoldeth.io)
- **FlowAI Platform**: See the main project documentation
- **Next.js**: [nextjs.org/docs](https://nextjs.org/docs)
- **Hardhat**: [hardhat.org/docs](https://hardhat.org/docs)

## 🤝 Contributing

We welcome contributions to the FlowAI development scaffold!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new AI agent functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENCE](LICENCE) file for details.

## 🔗 Related Projects

- **FlowAI Platform**: Main AI agent contracts and platform logic
- **FlowAI Client**: Production AI agent frontend application
- **FlowAI Scaffold**: This development environment