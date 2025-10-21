import type { WalletContextState } from './types';

export const WALLET_CONTEXT_INITIAL_STATE: WalletContextState = {
  wallet: null,
  balances: {
    list: [],
    map: {},
    isLoading: false,
  },
  transactions: {
    list: [],
    map: {},
    isLoading: false,
  },
  isUnlocked: false,
  isInitialized: false,
  isLoading: false,
  error: null,
};
