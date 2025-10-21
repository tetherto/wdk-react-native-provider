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
import { WalletProvider } from '@tetherto/wdk-react-native-provider';

const chains = {
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
        indexer: {
          apiKey: 'your-api-key-here',
          url: 'https://your-indexer-url.com',
        },
        chains: chains,
        enableCaching: true, // Optional: enable caching for balances and transactions
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
    balances,
    transactions,
    isLoading,
    isInitialized,
    isUnlocked,
    createWallet,
    unlockWallet,
    refreshWalletBalance,
    refreshTransactions,
  } = useWallet();

  // Create a new wallet
  const handleCreateWallet = async () => {
    try {
      const newWallet = await createWallet({
        name: 'My Wallet',
      });
      console.log('Wallet created:', newWallet);
    } catch (error) {
      console.error('Failed to create wallet:', error);
    }
  };

  // Import existing wallet
  const handleImportWallet = async () => {
    try {
      const imported = await createWallet({
        name: 'Imported Wallet',
        mnemonic: 'your twelve word mnemonic phrase here ...',
      });
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
      <Button title="Refresh Balance" onPress={refreshWalletBalance} />
      <Button title="Refresh Transactions" onPress={refreshTransactions} />
    </View>
  );
}
```

## API Reference

### WalletProvider

The main provider component that manages wallet state.

**Props:**

- `config.indexer` (object, required): Indexer service configuration
  - `config.indexer.apiKey` (string, required): API key for the indexer service
  - `config.indexer.url` (string, required): URL of the indexer service
  - `config.indexer.version` (string, optional): API version (defaults to 'v1')
- `config.chains` (ChainsConfig, required): Chain configuration object containing network-specific settings
- `config.enableCaching` (boolean, optional): Enable caching for balances and transactions to improve performance

See [Chain Configuration](#chain-configuration) for detailed configuration options.

### useWallet()

Hook to access wallet context and functionality.

**Returns:**

```typescript
{
  // State
  wallet?: Wallet | null;
  addresses?: AddressMap;
  balances: {
    list: Amount[];
    map: BalanceMap;
    isLoading: boolean;
  };
  transactions: {
    list: Transaction[];
    map: TransactionMap;
    isLoading: boolean;
  };
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  isUnlocked: boolean;

  // Actions
  createWallet: (params: { name: string; mnemonic?: string }) => Promise<Wallet | null>;
  clearWallet: () => Promise<void>;
  clearError: () => void;
  refreshWalletBalance: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
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

### Chains Configuration Structure

The `chains` configuration object supports the following blockchain networks:

```typescript
const chains = {
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
const ethereumConfig = {
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
const tonConfig = {
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
const bitcoinConfig = {
  host: 'api.ordimint.com',
  port: 50001,
};
```

### Tron Chain Configuration

```typescript
const tronConfig = {
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
import { WalletProvider } from '@tetherto/wdk-react-native-provider';

const chains = {
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
        indexer: {
          apiKey: 'your-indexer-api-key',
          url: 'https://your-indexer-url.com',
        },
        chains,
        enableCaching: true, // Optional: enable caching for better performance
      }}
    >
      <YourApp />
    </WalletProvider>
  );
}
```

## Advanced Usage

### Accessing Balances and Transactions

```tsx
const { wallet, addresses, balances, transactions } = useWallet();

if (wallet) {
  // Addresses
  if (addresses) {
    Object.entries(addresses).forEach(([ticker, addressList]) => {
      console.log(`${ticker}: ${addressList[0]?.value}`);
    });
  }

  // Balances - available as both list and map
  balances.list.forEach(balance => {
    console.log(`${balance.denomination}: ${balance.value}`);
  });

  // Or access by ticker from the map
  const usdtBalance = balances.map.USDT?.[0];
  console.log('USDT Balance:', usdtBalance?.value);

  // Check loading state
  if (balances.isLoading) {
    console.log('Loading balances...');
  }

  // Transactions - available as both list and map
  transactions.list.forEach(tx => {
    console.log('Transaction:', tx);
  });

  // Or access by ticker from the map
  const usdtTransactions = transactions.map.USDT;
  console.log('USDT Transactions:', usdtTransactions);

  // Check loading state
  if (transactions.isLoading) {
    console.log('Loading transactions...');
  }
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

  // Wallet types
  Amount,
  Transaction,
  Wallet,

  // Enums (also available as values)
  AssetTicker,
  NetworkType,
} from '@tetherto/wdk-react-native-provider';
```

**Note:** Chain configuration types (`ChainsConfig`, `EVMChainConfig`, `TONChainConfig`, etc.) are defined in the underlying `@tetherto/pear-wrk-wdk` package. TypeScript will infer these types when you use them in the `WalletProviderConfig`, so explicit imports are typically not needed.

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

The WDK service is initialized automatically when the `WalletProvider` mounts. If you see this error, ensure:

1. Your component is wrapped with `WalletProvider`
2. The provider's config is properly set
3. You're checking `isInitialized` before performing wallet operations:

```tsx
const { isInitialized, createWallet } = useWallet();

if (isInitialized) {
  await createWallet({ name: 'My Wallet' });
}
```

### "No wallet found"

Ensure a wallet has been created or imported before attempting transactions:

```tsx
const { wallet, createWallet } = useWallet();
if (!wallet) {
  await createWallet({ name: 'My Wallet' });
}
```

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

Apache-2.0

---

Made with ❤️ by [Tether](https://tether.to)
