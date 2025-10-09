// Import polyfills first - these must be loaded before any other code
import './polyfills';

// Export the wallet context and provider
export {
  useWallet,
  default as WalletContext,
  WalletProvider,
} from './contexts/wallet-context';
export type { WalletProviderConfig } from './contexts/wallet-context';

// Export WDK service
export { WDKService, wdkService } from './services/wdk-service';

// Export wallet setup utilities
export { initializeWalletWithSeed } from './services/wallet-setup';
export type { WalletSetupResult } from './services/wallet-setup';

// Export all types
export type {
  AccountData,
  Address,
  Amount,
  InitializeAccountParams,
  Transaction,
  Wallet,
} from './services/wdk-service/types';

// Export enums (can be used as both types and values)
export {
  AssetAddressMap,
  AssetBalanceMap,
  AssetTicker,
  NetworkType,
} from './services/wdk-service/types';
