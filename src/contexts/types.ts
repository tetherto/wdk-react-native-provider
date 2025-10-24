import type {
  AddressMap,
  Amount,
  BalanceMap,
  ChainsConfig,
  Transaction,
  TransactionMap,
  Wallet,
} from '../services/wdk-service/types';

export interface WalletContextState {
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
}

export interface WalletContextType extends WalletContextState {
  createWallet: (params: {
    name: string;
    mnemonic?: string;
  }) => Promise<WalletContextState['wallet']>;
  clearWallet: () => Promise<void>;
  clearError: () => void;
  refreshWalletBalance: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
  unlockWallet: () => Promise<boolean | undefined>;
}

// Provider configuration
export interface WalletProviderConfig {
  indexer: {
    apiKey: string;
    url: string;
    version?: string;
  };
  chains: ChainsConfig;
  enableCaching?: boolean;
}
