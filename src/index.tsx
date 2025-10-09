// Export the wallet context and provider
export { WalletProvider, useWallet } from './contexts/wallet-context';
export { default as WalletContext } from './contexts/wallet-context';
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
  Asset,
  AssetInfo,
  AssetNetworkInfo,
  AssetNetworkInfoWithAmount,
  AssetWithFiat,
  AssetWithFiatAndStats,
  FiatAmount,
  GroupedAsset,
  GroupedBalanceByNetworkType,
  Icon,
  InitializeAccountParams,
  InitializeAccountWithBalancesLazyParams,
  Jar,
  JarWithBalance,
  News,
  PendingTransaction,
  RefreshAccountBalanceParams,
  SecurityAlert,
  Suggestion,
  TokenSymbol,
  Transaction,
  TransactionMetadata,
  TransactionReceipt,
  TransactionWithFiat,
  Wallet,
  WalletWithBalance,
  WalletWithBalanceAndJars,
  WalletWithBalanceAndStats,
  GetTransactionReceiptParams,
} from './services/wdk-service/types';

// Export enums (can be used as both types and values)
export {
  AssetTicker,
  Denomination,
  FiatCurrency,
  NetworkType,
  TransactionStatus,
  TransactionType,
  SuggestionType,
  Provider,
  AssetAddressMap,
  AssetBalanceMap,
  AssetReceiveMap,
  AssetSendMap,
} from './services/wdk-service/types';
