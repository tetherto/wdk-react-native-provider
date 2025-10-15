# @tetherto/wdk-react-native-provider

A React Native library providing wallet context and WDK (Wallet Development Kit) service integration for building secure, multi-chain cryptocurrency wallets.

## Features

- **Multi-chain Support**: Bitcoin, Ethereum, Polygon, Arbitrum, TON, Solana, and Tron
- **Multi-asset Management**: BTC, USDT, XAUT, and more
- **Secure Seed Management**: Encrypted seed phrase storage using native keychain
- **React Context API**: Easy-to-use wallet context provider and hooks
- **Account Management**: Create, import, and unlock wallets
- **Balance & Transactions**: Real-time balance updates and transaction history
- **Send & Quote**: Transaction sending and fee estimation
- **TypeScript Support**: Full type definitions included

## Installation

```sh
npm install @tetherto/wdk-react-native-provider
```

### Peer Dependencies

This library requires several peer dependencies. Install them using:

```sh
npm install \
  @craftzdog/react-native-buffer \
  @react-native-async-storage/async-storage \
  @tetherto/pear-wrk-wdk \
  @tetherto/wdk-secret-manager \
  b4a \
  bip39 \
  decimal.js \
  process \
  react-native-bare-kit \
  react-native-crypto \
  react-native-device-info \
  react-native-get-random-values \
  react-native-keychain
```

## Quick Start

### 1. Setup the WalletProvider

Wrap your app with the `WalletProvider` and provide the required configuration:

```tsx
import { WalletProvider, type ChainsConfig } from '@tetherto/wdk-react-native-provider';

const chains: ChainsConfig = {
  ethereum: {
    chainId: 1,
    blockchain: 'ethereum',
    provider: 'https://mainnet.gateway.tenderly.co/YOUR_KEY',
    bundlerUrl: 'https://api.candide.dev/public/v3/ethereum',
    paymasterUrl: 'https://api.candide.dev/public/v3/ethereum',
    paymasterAddress: '0x8b1f6cb5d062aa2ce8d581942bbb960420d875ba',
    entrypointAddress: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
    transferMaxFee: 5000000,
    swapMaxFee: 5000000,
    bridgeMaxFee: 5000000,
    paymasterToken: {
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    },
  },
  bitcoin: {
    host: 'api.ordimint.com',
    port: 50001,
  },
  // ... other chains
};

function App() {
  return (
    <WalletProvider
      config={{
        indexerApiKey: 'your-api-key-here',
        chains: chains,
      }}
    >
      <YourApp />
    </WalletProvider>
  );
}
```

### 2. Use the Wallet Context

Access wallet functionality using the `useWallet` hook:

```tsx
import { useWallet } from '@tetherto/wdk-react-native-provider';

function WalletScreen() {
  const {
    wallet,
    isLoading,
    isInitialized,
    isUnlocked,
    createWallet,
    importWallet,
    unlockWallet,
    refreshWalletBalance,
  } = useWallet();

  // Create a new wallet
  const handleCreateWallet = async () => {
    try {
      const newWallet = await createWallet({
        name: 'My Wallet',
        type: 'primary',
        network: 'ethereum',
        icon: '💎',
      });
      console.log('Wallet created:', newWallet);
    } catch (error) {
      console.error('Failed to create wallet:', error);
    }
  };

  // Import existing wallet
  const handleImportWallet = async () => {
    try {
      const imported = await importWallet(
        'your twelve word mnemonic phrase here ...',
        'Imported Wallet',
        '🔑'
      );
      console.log('Wallet imported:', imported);
    } catch (error) {
      console.error('Failed to import wallet:', error);
    }
  };

  // Unlock wallet
  const handleUnlockWallet = async () => {
    try {
      await unlockWallet();
      console.log('Wallet unlocked');
    } catch (error) {
      console.error('Failed to unlock wallet:', error);
    }
  };

  if (!isInitialized) {
    return <Text>Initializing...</Text>;
  }

  if (!wallet) {
    return (
      <View>
        <Button title="Create Wallet" onPress={handleCreateWallet} />
        <Button title="Import Wallet" onPress={handleImportWallet} />
      </View>
    );
  }

  if (!isUnlocked) {
    return <Button title="Unlock Wallet" onPress={handleUnlockWallet} />;
  }

  return (
    <View>
      <Text>Wallet Name: {wallet.name}</Text>
      <Text>Balance: {wallet.accountData?.balances[0]?.value}</Text>
      <Button title="Refresh Balance" onPress={refreshWalletBalance} />
    </View>
  );
}
```

## API Reference

### WalletProvider

The main provider component that manages wallet state.

**Props:**

- `config.indexerApiKey` (string, required): API key for the indexer service
- `config.chains` (ChainsConfig, required): Chain configuration object containing network-specific settings

See [Chain Configuration](#chain-configuration) for detailed configuration options.

### useWallet()

Hook to access wallet context and functionality.

**Returns:**

```typescript
{
  // State
  wallet: WalletWithAccountData | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  isUnlocked: boolean;

  // Actions
  setWallet: (wallet: WalletWithAccountData | null) => void;
  updateWallet: (updates: Partial<WalletWithAccountData>) => void;
  clearWallet: () => void;

  // Async Operations
  initializeWDK: () => Promise<void>;
  loadWallet: () => Promise<void>;
  createWallet: (params: CreateWalletParams) => Promise<WalletWithAccountData>;
  importWallet: (mnemonic: string, name: string, icon?: string) => Promise<WalletWithAccountData>;
  refreshWalletBalance: () => Promise<void>;
  unlockWallet: () => Promise<boolean | undefined>;
}
```

### WDKService

Low-level service for direct wallet operations. Available as a singleton.

```tsx
import { WDKService } from '@tetherto/wdk-react-native-provider';

// Initialize WDK
await WDKService.initialize();

// Create seed
const seed = await WDKService.createSeed({ prf: 'passkey' });

// Import seed phrase
await WDKService.importSeedPhrase({
  prf: 'passkey',
  seedPhrase: 'your mnemonic here',
});

// Create wallet
const wallet = await WDKService.createWallet({
  walletName: 'My Wallet',
  prf: 'passkey',
});

// Get balances
const balances = await WDKService.resolveWalletBalances(
  enabledAssets,
  addressMap
);

// Send transaction
const result = await WDKService.sendByNetwork(
  NetworkType.ETHEREUM,
  0, // account index
  100, // amount
  '0x...', // recipient address
  AssetTicker.USDT
);
```

## Chain Configuration

The library supports multiple blockchain networks, each with its own configuration structure.

### ChainsConfig Type

```typescript
import type { ChainsConfig } from '@tetherto/wdk-react-native-provider';

const chains: ChainsConfig = {
  ethereum?: EVMChainConfig;
  arbitrum?: EVMChainConfig;
  polygon?: EVMChainConfig;
  ton?: TONChainConfig;
  bitcoin?: BitcoinChainConfig;
  tron?: TronChainConfig;
}
```

### EVM Chain Configuration

For Ethereum, Polygon, and Arbitrum:

```typescript
import type { EVMChainConfig } from '@tetherto/wdk-react-native-provider';

const ethereumConfig: EVMChainConfig = {
  chainId: 1,
  blockchain: 'ethereum',
  provider: 'https://mainnet.gateway.tenderly.co/YOUR_KEY',
  bundlerUrl: 'https://api.candide.dev/public/v3/ethereum',
  paymasterUrl: 'https://api.candide.dev/public/v3/ethereum',
  paymasterAddress: '0x8b1f6cb5d062aa2ce8d581942bbb960420d875ba',
  entrypointAddress: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
  transferMaxFee: 5000000,
  swapMaxFee: 5000000,
  bridgeMaxFee: 5000000,
  paymasterToken: {
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  },
  safeModulesVersion: '0.3.0', // Optional, for Polygon
};
```

### TON Chain Configuration

```typescript
import type { TONChainConfig } from '@tetherto/wdk-react-native-provider';

const tonConfig: TONChainConfig = {
  tonApiClient: {
    url: 'https://tonapi.io',
  },
  tonClient: {
    url: 'https://toncenter.com/api/v2/jsonRPC',
  },
  paymasterToken: {
    address: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
  },
  transferMaxFee: 1000000000,
};
```

### Bitcoin Chain Configuration

```typescript
import type { BitcoinChainConfig } from '@tetherto/wdk-react-native-provider';

const bitcoinConfig: BitcoinChainConfig = {
  host: 'api.ordimint.com',
  port: 50001,
};
```

### Tron Chain Configuration

```typescript
import type { TronChainConfig } from '@tetherto/wdk-react-native-provider';

const tronConfig: TronChainConfig = {
  chainId: 3448148188,
  provider: 'https://trongrid.io',
  gasFreeProvider: 'https://gasfree.io',
  apiKey: 'your-api-key',
  apiSecret: 'your-api-secret',
  serviceProvider: 'TKtWbdzEq5ss9vTS9kwRhBp5mXmBfBns3E',
  verifyingContract: 'THQGuFzL87ZqhxkgqYEryRAd7gqFqL5rdc',
  transferMaxFee: 10000000,
  swapMaxFee: 1000000,
  bridgeMaxFee: 1000000,
  paymasterToken: {
    address: 'TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf',
  },
};
```

### Complete Configuration Example

```typescript
import { WalletProvider, type ChainsConfig } from '@tetherto/wdk-react-native-provider';

const chains: ChainsConfig = {
  ethereum: {
    chainId: 1,
    blockchain: 'ethereum',
    provider: 'https://mainnet.gateway.tenderly.co/YOUR_KEY',
    bundlerUrl: 'https://api.candide.dev/public/v3/ethereum',
    paymasterUrl: 'https://api.candide.dev/public/v3/ethereum',
    paymasterAddress: '0x8b1f6cb5d062aa2ce8d581942bbb960420d875ba',
    entrypointAddress: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
    transferMaxFee: 5000000,
    swapMaxFee: 5000000,
    bridgeMaxFee: 5000000,
    paymasterToken: {
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    },
  },
  polygon: {
    chainId: 137,
    blockchain: 'polygon',
    provider: 'https://polygon.gateway.tenderly.co/YOUR_KEY',
    bundlerUrl: 'https://api.candide.dev/public/v3/polygon',
    paymasterUrl: 'https://api.candide.dev/public/v3/polygon',
    paymasterAddress: '0x8b1f6cb5d062aa2ce8d581942bbb960420d875ba',
    entrypointAddress: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
    transferMaxFee: 5000000,
    swapMaxFee: 5000000,
    bridgeMaxFee: 5000000,
    paymasterToken: {
      address: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
    },
    safeModulesVersion: '0.3.0',
  },
  arbitrum: {
    chainId: 42161,
    blockchain: 'arbitrum',
    provider: 'https://arbitrum.gateway.tenderly.co/YOUR_KEY',
    bundlerUrl: 'https://api.candide.dev/public/v3/arbitrum',
    paymasterUrl: 'https://api.candide.dev/public/v3/arbitrum',
    paymasterAddress: '0x8b1f6cb5d062aa2ce8d581942bbb960420d875ba',
    entrypointAddress: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
    transferMaxFee: 5000000,
    swapMaxFee: 5000000,
    bridgeMaxFee: 5000000,
    paymasterToken: {
      address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    },
  },
  ton: {
    tonApiClient: {
      url: 'https://tonapi.io',
    },
    tonClient: {
      url: 'https://toncenter.com/api/v2/jsonRPC',
    },
    paymasterToken: {
      address: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
    },
    transferMaxFee: 1000000000,
  },
  bitcoin: {
    host: 'api.ordimint.com',
    port: 50001,
  },
  tron: {
    chainId: 3448148188,
    provider: 'https://trongrid.io',
    gasFreeProvider: 'https://gasfree.io',
    apiKey: 'your-api-key',
    apiSecret: 'your-api-secret',
    serviceProvider: 'TKtWbdzEq5ss9vTS9kwRhBp5mXmBfBns3E',
    verifyingContract: 'THQGuFzL87ZqhxkgqYEryRAd7gqFqL5rdc',
    transferMaxFee: 10000000,
    swapMaxFee: 1000000,
    bridgeMaxFee: 1000000,
    paymasterToken: {
      address: 'TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf',
    },
  },
};

function App() {
  return (
    <WalletProvider
      config={{
        indexerApiKey: 'your-indexer-api-key',
        chains,
      }}
    >
      <YourApp />
    </WalletProvider>
  );
}
```

## Advanced Usage

### Using initializeWallet

For manual wallet initialization:

```tsx
import { initializeWallet } from '@tetherto/wdk-react-native-provider';

const result = await initializeWallet(
  'My Wallet',
  'passkey'
);

if (result.success) {
  console.log('Wallet initialized:', result.wallet);
} else {
  console.error('Failed:', result.error);
}
```

### Accessing Account Data

```tsx
const { wallet } = useWallet();

if (wallet?.accountData) {
  // Addresses
  wallet.accountData.addresses.forEach(addr => {
    console.log(`${addr.networkType}: ${addr.value}`);
  });

  // Balances
  wallet.accountData.balances.forEach(balance => {
    console.log(`${balance.denomination}: ${balance.value}`);
  });

  // Transactions
  wallet.accountData.transactions.forEach(tx => {
    console.log('Transaction:', tx);
  });
}
```

### Network Types

```typescript
import { NetworkType } from '@tetherto/wdk-react-native-provider';

// Available networks:
NetworkType.SEGWIT    // Bitcoin
NetworkType.ETHEREUM  // Ethereum
NetworkType.POLYGON   // Polygon
NetworkType.ARBITRUM  // Arbitrum
NetworkType.TON       // TON
NetworkType.SOLANA    // Solana
NetworkType.TRON      // Tron
```

### Asset Tickers

```typescript
import { AssetTicker } from '@tetherto/wdk-react-native-provider';

// Available assets:
AssetTicker.BTC   // Bitcoin
AssetTicker.USDT  // Tether USD
AssetTicker.XAUT  // Tether Gold
```

## TypeScript Support

This library is written in TypeScript and includes complete type definitions. Import types as needed:

```typescript
import type {
  // Provider configuration
  WalletProviderConfig,

  // Chain configuration types
  ChainsConfig,
  EVMChainConfig,
  TONChainConfig,
  BitcoinChainConfig,
  TronChainConfig,
  PaymasterToken,

  // Wallet types
  AccountData,
  Address,
  Amount,
  Transaction,
  Wallet,
} from '@tetherto/wdk-react-native-provider';
```

## Security Considerations

- **Seed Phrase Storage**: Seed phrases are encrypted and stored securely using device-specific encryption
- **Passkey/PRF**: Uses device unique ID by default. In production, integrate with biometric authentication
- **Never Log Seeds**: Never log or display seed phrases in production code
- **Secure Communication**: All API calls use HTTPS and require API keys

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md) for development workflow and guidelines.

### Build

```sh
npm run prepare
```

### Type Check

```sh
npm run typecheck
```

### Lint

```sh
npm run lint
```

### Test

```sh
npm test
```

## Troubleshooting

### "WDK Manager not initialized"

Make sure to call `initializeWDK()` or create/import a wallet before performing operations:

```tsx
const { initializeWDK, createWallet } = useWallet();
await initializeWDK();
```

### "No wallet found"

Ensure a wallet has been created or imported before attempting transactions:

```tsx
const { wallet, createWallet } = useWallet();
if (!wallet) {
  await createWallet({ name: 'My Wallet', type: 'primary', network: 'ethereum' });
}
```

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

Apache-2.0

---

Made with ❤️ by [Tether](https://tether.to)
