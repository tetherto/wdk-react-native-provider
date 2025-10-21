// Import polyfills first - these must be loaded before any other code
import './polyfills';

// Export the wallet context and provider
export {
  useWallet,
  default as WalletContext,
  WalletProvider,
} from './contexts/wallet-context';
export type { WalletProviderConfig } from './contexts/types';

// Export WDK service
export {
  WDKService,
  wdkService,
  SMART_CONTRACT_BALANCE_ADDRESSES,
} from './services/wdk-service';

// Export all types
export type {
  AccountData,
  Address,
  Amount,
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
