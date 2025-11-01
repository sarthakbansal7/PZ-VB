# PayZoll

## 🚀 All in one Suite for Web3 Payments

[![Next.js](https://img.shields.io/badge/Next.js-15.3.0-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.1.0-blue?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Wagmi](https://img.shields.io/badge/Wagmi-2.14.16-purple?style=flat-square)](https://wagmi.sh/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.0-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Flow EVM](https://img.shields.io/badge/Flow%20EVM-Mainnet%20%7C%20Testnet-green?style=flat-square)](https://flow.com/)

PayZoll is a Web3 payment infrastructure that consolidates multiple payment operations into a single dashboard. Built for businesses and DAOs, it handles bulk transfers, airdrops, payroll, streaming payments, and invoicing - all from one interface instead of juggling multiple platforms.

📊 **[View Live Analytics Dashboard](https://dune.com/sarthak10/payzoll)** - Real-time transaction data and usage metrics on Flow EVM

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Network Support](#network-support)
- [Smart Contracts](#smart-contracts)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Core Modules](#core-modules)
- [Team](#team)
- [Achievements](#achievements)
- [Contributing](#contributing)
- [License](#license)

## 🌟 Overview

PayZoll solves the fragmented Web3 payments problem. Instead of using separate tools for payroll, airdrops, and bulk transfers, teams get everything in one place. We built it because managing payments across multiple DApps was getting ridiculous - especially when you're trying to pay 50+ contributors or distribute tokens to thousands of users.

### 🎯 Why We Built This

Web3 payments shouldn't be harder than Web2. You shouldn't need 5 different tools to pay your team, distribute tokens, or handle invoices. PayZoll consolidates this into one dashboard because context switching between DApps kills productivity.

## ✨ Features

### 🔴 Live Features

**🎛️ Unified Dashboard**: Everything in one place - no more browser tab chaos

- **💼 Bulk Transfers**: Send to multiple addresses in one transaction. Supports CSV uploads and saves ~80% on gas costs compared to individual transfers
- **🎁 Airdrops**: Token distribution with claim mechanics. Recipients pull when ready, saving you gas on failed transactions
- **👥 DAO Payroll**: Recurring payments for contributors. Set it once, automates monthly. Works with any ERC20 token
- **📡 Token Streaming**: Linear vesting and real-time payments. Good for freelancers or time-locked compensation
- **📄 Invoices**: Professional crypto invoicing. Share links, track payments, get notified when paid

**Access everything from `/dashboard` - one URL, one wallet connection, done**

🔗 **[Analytics & Metrics](https://dune.com/sarthak10/payzoll)** - Track transaction volumes, user adoption, and protocol usage in real-time


## 🛠️ Technology Stack

### Frontend
- **Next.js 15.3.0**: Modern React framework with App Router
- **React 19.1.0**: Latest React with concurrent features
- **TypeScript 5**: Type-safe development
- **Tailwind CSS 4**: Utility-first CSS framework
- **Framer Motion**: Smooth animations and transitions
- **React Hook Form**: Efficient form handling

### Web3 Integration
- **Wagmi 2.14.16**: React hooks for Ethereum
- **Rainbow Kit**: Beautiful wallet connection interface
- **Viem 2.25.0**: TypeScript interface for Ethereum
- **Ethers.js 6.13.5**: Ethereum library

### UI/UX
- **Radix UI**: Accessible component primitives
- **Lucide React**: Beautiful icons
- **React Hot Toast**: Notification system
- **Recharts**: Data visualization

### Development Tools
- **Axios**: HTTP client for API calls
- **React Router DOM**: Client-side routing
- **Three.js**: 3D graphics and animations

## 🌐 Network Support

PayZoll is built specifically for the **Flow EVM**, supporting both mainnet and testnet environments:

### Flow EVM Mainnet
- **Chain ID**: 747
- **RPC URL**: https://mainnet.evm.nodes.onflow.org
- **Explorer**: https://evm.flowscan.io
- **Native Token**: FLOW

### Flow EVM Testnet
- **Chain ID**: 545
- **RPC URL**: https://testnet.evm.nodes.onflow.org
- **Explorer**: https://evm-testnet.flowscan.io
- **Native Token**: FLOW (Testnet)

## 📋 Smart Contracts

PayZoll operates through a suite of gas-optimized smart contracts deployed on both Flow EVM Mainnet and Testnet:

### Contract Addresses

#### Flow EVM Mainnet (Chain ID: 747)
| Contract | Address | Purpose |
|----------|---------|---------|
| **Bulk Transfer** | `0x25BC332447444A00d1F52538b03Fec079e5cd5bC` | Multi-recipient token transfers |
| **Airdrop** | `0x9ce2DaF245ADe333A77c6DCfC56845d491b33CfB` | Token distribution with claim mechanism |
| **Payroll** | `0x563442Ec415De8444059A46fc09F0F552AE8661a` | Automated employee payments |
| **Stream** | `0xDfcB96A9A5744CdfB173C36849Af5bD7343DAb7E` | Continuous payment streaming |
| **Invoices** | `0x2D7522b86eB4dbbdE52482dB362be5DE2Ad3d096` | Invoice creation and payment |

#### Flow EVM Testnet (Chain ID: 545)
| Contract | Address | Purpose |
|----------|---------|---------|
| **Bulk Transfer** | `0xDfcB96A9A5744CdfB173C36849Af5bD7343DAb7E` | Multi-recipient token transfers |
| **Airdrop** | `0x563442Ec415De8444059A46fc09F0F552AE8661a` | Token distribution with claim mechanism |
| **Payroll** | `0x0A51554c3a743A62fcb6a633cf04CB2e0cd14169` | Automated employee payments |
| **Stream** | `0xbb7E1b1Ef5c36fC4aE96879Ea3c4586B68569cAC` | Continuous payment streaming |
| **Invoices** | `0x41353BAFF99bAB4AfE2bb6acF0C75B80137f` | Invoice creation and payment |

### Contract Features

#### 🔄 Bulk Transfer Contract
- **Gas Optimized**: Minimal gas consumption for batch operations
- **Safety Checks**: Comprehensive validation and error handling
- **Events**: Detailed transaction logging

#### 🎁 Airdrop Contract
- **Claim Mechanism**: Recipients claim tokens when ready
- **Lock & Release**: Secure token locking with controlled release
- **Batch Operations**: Efficient multi-recipient distributions
- **Balance Tracking**: Individual claimable balance management

#### 💼 Payroll Contract
- **Reentrancy Protection**: OpenZeppelin security standards
- **Allowance Optimization**: Efficient ERC20 handling
- **Refund Mechanism**: Automatic excess amount returns
- **Event Logging**: Comprehensive transaction tracking

#### 📡 Stream Contract
- **Linear Vesting**: Time-based token release
- **Real-time Claims**: Continuous payment streaming
- **Multi-Stream Support**: Multiple concurrent streams per user
- **Stream Management**: Full lifecycle control

#### 📄 Invoice Contract
- **Simple Interface**: Easy invoice creation and payment
- **Payment Tracking**: Comprehensive payment history
- **Creator Management**: User-specific invoice management
- **Event System**: Payment confirmation events

## 🏗️ Architecture

PayZoll follows a modern, scalable architecture pattern:

```
┌─────────────────────────────────────────────────────────────┐
│                 Unified Dashboard Layer                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │
│  │  Dashboard  │ │   Service   │ │    Payment Config       │ │
│  │  Control    │ │Integration  │ │    Management           │ │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer                           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │
│  │   Next.js   │ │   React     │ │      Tailwind CSS       │ │
│  │    App      │ │ Components  │ │      Styling            │ │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                   Web3 Integration                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │
│  │    Wagmi    │ │ RainbowKit  │ │        Viem             │ │
│  │   Hooks     │ │   Wallet    │ │    Type-safe            │ │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                  Blockchain Layer                           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │
│  │Flow Mainnet │ │Flow Testnet │ │    Smart Contracts      │ │
│  │  Chain 747  │ │ Chain 545   │ │    Solidity ^0.8.19     │ │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

1. **Dynamic Chain Detection**: Automatic contract address resolution based on connected network
2. **Type Safety**: Full TypeScript implementation for enhanced developer experience
3. **Component Modularity**: Reusable components across all features
4. **Gas Optimization**: Smart contracts designed for minimal gas consumption
5. **User Experience**: Seamless wallet integration with clear status indicators

## 🚀 Getting Started

### Prerequisites

- Node.js 18.0.0 or higher
- npm, yarn, or pnpm package manager
- Git for version control

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/PayZoll-Orgs/PZ-VB.git
   cd PayZoll_Client_Pharos
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure your environment variables:
   ```env
   NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_wallet_connect_project_id
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Project Structure

```
PayZoll_Client_Pharos/
├── app/                          # Next.js App Router
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Landing page
│   └── pages/                   # Application pages
│       ├── about/               # About page
│       ├── dashboard/          # Unified Dashboard (Main Entry)
│       ├── airdrop/            # Airdrop functionality
│       ├── bulk/               # Bulk payments
│       ├── dao/                # DAO payroll
│       ├── invoices/           # Invoice management
│       └── streaming/          # Payment streaming
├── components/                  # Reusable components
│   ├── auth/                   # Authentication components
│   ├── home/                   # Landing page components
│   ├── payroll/               # Payroll-specific components
│   └── ui/                    # UI primitives
├── contracts/                  # Smart contract source code
│   ├── airdrop.sol
│   ├── bulkTransfer.sol
│   ├── invoices.sol
│   ├── payroll.sol
│   └── stream.sol
├── lib/                       # Utility libraries
│   ├── contract-addresses.ts  # Contract configuration
│   ├── wagmiConfig.ts        # Web3 configuration
│   └── utils.ts              # General utilities
└── hooks/                     # Custom React hooks
```

## 🎯 Core Modules

### 🎛️ Unified Dashboard
**Main Path**: `/dashboard` - **Your Central Payment Control Center**

All PayZoll services are integrated into a single, intuitive dashboard that eliminates the need to navigate between different interfaces. The dashboard provides:

**Dashboard Features**:
- **Service Switcher**: Seamlessly switch between all payment services
- **Unified Interface**: Consistent UX across all payment operations  
- **Configuration Management**: Centralized payment settings and token configuration
- **Real-time Monitoring**: Track all transactions and payment status from one place
- **Responsive Design**: Optimized for desktop and mobile devices

### Available Services within Dashboard:

#### 1. 💼 Bulk Transfer
Efficiently distribute payments to multiple recipients in a single transaction.

**Features**:
- Multi-recipient token transfers
- Gas cost optimization  
- CSV upload support for recipient lists
- Real-time transaction tracking
- Support for both FLOW and ERC20 tokens

#### 2. 🎁 Airdrop
Seamlessly distribute tokens to multiple wallets with customizable criteria.

**Features**:
- Token claim mechanism
- Batch recipient management
- Automated distribution workflows  
- Claimable balance tracking
- Event-driven notifications

#### 3. 👥 DAO Payroll
Automated payroll management for decentralized organizations.

**Features**:
- Employee management system
- Automated payment scheduling
- Token allowance handling
- Payment history tracking
- Role-based access control

#### 4. 📡 Token Streaming
Real-time money flows with continuous value transfer.

**Features**:
- Linear vesting schedules
- Real-time claim calculations
- Multiple concurrent streams
- Stream lifecycle management
- Instant payment processing

#### 5. 📄 Invoices  
Create and manage professional invoices with crypto payment support.

**Features**:
- Invoice creation and management
- Payment tracking
- Creator-specific invoice lists
- Payment confirmation system
- Professional invoice formatting

**Why Unified Dashboard?**
- **Single Entry Point**: No need to remember multiple URLs or navigate between different interfaces
- **Consistent Experience**: Same UI patterns and interactions across all services
- **Efficient Workflow**: Switch between services without losing context or re-connecting wallet
- **Centralized Management**: All your payment activities visible and manageable from one place

## 👥 Team

### Vaibhav Panwar - Founder
Business development expert with entrepreneurial experience. Previously managed North-East India operations for an e-commerce startup with 100+ team members.

### Abhinav Pangaria - Co-Founder & Lead Engineer
Full-stack & blockchain developer with expertise in Solidity, Move, Rust, and MERN stack (Next, React-Native). Leads development of smart contracts and frontend & backend development.



## 🏆 Achievements

**Backed by Stellar Blockchain** - **PayZoll** has been recognized and won multiple major events including some of the biggest hackathons in the Web3 space:


- 🥇 **Winner** – **BNB Chain Hackathon Q4** 
- 🥇 **Winner** – **Stellar Build Hackathon** 
- 🥇 **Winner** – **Pharos Builder Base Camp** 
- 🥇 **Winner** – **ETHIndia Hackathon** 
- 🎓 **Selected** – **EduChain OpenCampus Incubation Program** (Prestigious Web3 education incubator)

PayZoll's proven track record across multiple blockchain ecosystems demonstrates our commitment to building on-chain payment infrastructure that serves the entire Web3 community.

## 🔧 Development

### Build for Production

```bash
npm run build
npm run start
```

### Linting

```bash
npm run lint
```

### Type Checking

```bash
npx tsc --noEmit
```

## 🤝 Contributing

We welcome contributions to PayZoll! Please read our contributing guidelines before submitting pull requests.

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Code Standards

- Follow TypeScript best practices
- Use ESLint configuration
- Write meaningful commit messages
- Add documentation for new features

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Website**: [PayZoll Platform](https://payzoll-green.vercel.app/)
- **Dashboard**: [Unified Payment Control Center](https://payzoll-green.vercel.app/pages/dashboard/)
- **📊 Analytics**: [Dune Dashboard - PayZoll Metrics](https://dune.com/sarthak10/payzoll)
- **Flow Network**: [Official Website](https://flow.com/)
- **Flow EVM Explorer**: [Mainnet](https://evm.flowscan.io) | [Testnet](https://evm-testnet.flowscan.io)

---

**PayZoll** - Empowering the future of Web3 payments 🚀