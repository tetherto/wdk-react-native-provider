import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useReducer } from 'react';
import { WDKService } from '../services/wdk-service';
import type {
  AddressMap,
  AssetTicker,
  BalanceMap,
  TransactionMap,
} from '../services/wdk-service/types';
import type {
  WalletContextState,
  WalletContextType,
  WalletProviderConfig,
} from './types';
import walletReducer from './reducer';
import { getUniqueId } from 'react-native-device-info';
import { WALLET_CONTEXT_INITIAL_STATE } from './constants';

const STORAGE_KEY_WALLET = 'wdk_wallet_data';
const STORAGE_KEY_ADDRESSES = 'wdk_wallet_addresses';
const STORAGE_KEY_BALANCES = 'wdk_wallet_balances';
const STORAGE_KEY_TRANSACTIONS = 'wdk_wallet_transactions';

// Create context
const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Provider component
export function WalletProvider({
  children,
  config,
}: {
  children: ReactNode;
  config: WalletProviderConfig;
}) {
  const [state, dispatch] = useReducer(
    walletReducer,
    WALLET_CONTEXT_INITIAL_STATE
  );

  // Set WDK config on mount
  useEffect(() => {
    WDKService.setConfig({
      ...config,
      indexer: { ...config.indexer, version: config.indexer.version || 'v1' },
    });

    initializeWDK();
  }, [config]);

  // Load wallet from storage on mount
  useEffect(() => {
    loadStoredWallet();
  }, []);

  useEffect(() => {
    const enabledAssets = state.wallet?.enabledAssets;
    const addressMap = state.addresses;

    if (enabledAssets && addressMap) {
      fetchBalances();
      fetchTransactions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.wallet?.enabledAssets, state.addresses]);

  // Save wallet to storage whenever wallet changes
  useEffect(() => {
    if (state.isInitialized && state.wallet) {
      saveWalletToStorage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.wallet, state.isInitialized]);

  const loadStoredWallet = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY_WALLET);
      if (stored) {
        const data = JSON.parse(stored);
        let parsed: WalletContextState['wallet'] = data;

        if (parsed) {
          dispatch({ type: 'SET_WALLET', payload: parsed });
        }
      }
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload:
          error instanceof Error
            ? error.message
            : 'Failed to load stored wallet',
      });

      console.error('Failed to load stored wallet:', error);
    }
  };

  const saveWalletToStorage = async () => {
    try {
      if (state.wallet) {
        await AsyncStorage.setItem(
          STORAGE_KEY_WALLET,
          JSON.stringify(state.wallet)
        );
      }
    } catch (error) {
      console.error('Failed to save wallet to storage:', error);
    }
  };

  const getWalletAddresses = async (enabledAssets: AssetTicker[]) => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY_ADDRESSES);
      if (stored) {
        return JSON.parse(stored);
      } else {
        const addresses =
          await WDKService.resolveWalletAddresses(enabledAssets);
        await AsyncStorage.setItem(
          STORAGE_KEY_ADDRESSES,
          JSON.stringify(addresses)
        );
        return addresses;
      }
    } catch (error) {
      console.error('Failed to get wallet addresses:', error);
    }
  };

  const clearError = () => {
    dispatch({ type: 'SET_ERROR', payload: null });
  };

  const initializeWDK = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await WDKService.initialize();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to initialize WDK';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({ type: 'SET_INITIALIZED', payload: true });
    }
  };

  const createWallet = async (params: {
    name: string;
    mnemonic?: string;
  }): Promise<WalletContextState['wallet']> => {
    if (!state.isInitialized) {
      throw new Error('WDK is not initialized');
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const prf = await getUniqueId();

      if (params.mnemonic) {
        await WDKService.importSeedPhrase({ prf, seedPhrase: params.mnemonic });
      } else {
        await WDKService.createSeed({ prf });
      }

      const wallet = await WDKService.createWallet({
        walletName: params.name,
        prf,
      });

      const addresses = await getWalletAddresses(wallet.enabledAssets);

      dispatch({ type: 'SET_WALLET', payload: wallet });
      dispatch({ type: 'SET_ADDRESSES', payload: addresses });
      dispatch({ type: 'SET_UNLOCKED', payload: true });

      return wallet;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create wallet';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const unlockWallet = async () => {
    if (!state.wallet) {
      throw new Error('No wallet found');
    }

    try {
      // Get device ID for seed retrieval
      const prf = await getUniqueId();

      // Create wallet using the stored seed
      const wallet = await WDKService.createWallet({
        walletName: state.wallet.name,
        prf,
      });

      const addresses = await getWalletAddresses(wallet.enabledAssets);

      dispatch({ type: 'SET_WALLET', payload: wallet });
      dispatch({ type: 'SET_ADDRESSES', payload: addresses });
      dispatch({ type: 'SET_UNLOCKED', payload: true });

      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to unlock wallet';
      throw new Error(errorMessage);
    }
  };

  const clearWallet = async () => {
    dispatch({ type: 'CLEAR_WALLET' });
    try {
      await AsyncStorage.removeItem(STORAGE_KEY_WALLET);
      await AsyncStorage.removeItem(STORAGE_KEY_ADDRESSES);
      await AsyncStorage.removeItem(STORAGE_KEY_BALANCES);
      await AsyncStorage.removeItem(STORAGE_KEY_TRANSACTIONS);
      await WDKService.clearWallet();
    } catch (error) {
      console.error('Failed to clear wallet from AsyncStorage:', error);
    }
  };

  const getUpdatedBalances = async (params: {
    enabledAssets: AssetTicker[];
    addressMap: AddressMap;
  }): Promise<BalanceMap> => {
    const { enabledAssets, addressMap } = params;
    const balanceMap = await WDKService.resolveWalletBalances(
      enabledAssets,
      addressMap
    );

    if (config.enableCaching) {
      // save fresh data to AsyncStorage
      await AsyncStorage.setItem(
        STORAGE_KEY_BALANCES,
        JSON.stringify(balanceMap)
      );
    }

    return balanceMap;
  };

  const getUpdatedTransactions = async (params: {
    enabledAssets: AssetTicker[];
    addressMap: AddressMap;
  }): Promise<TransactionMap> => {
    const { enabledAssets, addressMap } = params;
    const transactionMap = await WDKService.resolveWalletTransactions(
      enabledAssets,
      addressMap
    );

    if (config.enableCaching) {
      // save fresh data to AsyncStorage
      await AsyncStorage.setItem(
        STORAGE_KEY_TRANSACTIONS,
        JSON.stringify(transactionMap)
      );
    }

    return transactionMap;
  };

  const fetchBalances = async (params?: { forceUpdate?: boolean }) => {
    const { forceUpdate = false } = params || {};

    if (!state.wallet) {
      throw new Error('Wallet not found');
    }

    if (!state.addresses) {
      throw new Error('Addresses not found');
    }

    const enabledAssets = state.wallet.enabledAssets || [];
    const addressMap = state.addresses || {};

    // Check if we have cached balances in state
    if (config.enableCaching && !forceUpdate) {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY_BALANCES);
        if (stored) {
          const balanceMap: BalanceMap = JSON.parse(stored);
          dispatch({ type: 'SET_BALANCES', payload: balanceMap });
        }
      } catch (error) {
        console.error('Failed to load cached balances:', error);
      }
    }

    // Set loading state
    dispatch({ type: 'SET_LOADING_BALANCES', payload: true });

    try {
      // Fetch fresh data
      const balanceMap = await getUpdatedBalances({
        enabledAssets,
        addressMap,
      });

      // Update state with fresh data
      dispatch({ type: 'SET_BALANCES', payload: balanceMap });
    } catch (error) {
      console.error('Failed to fetch balances:', error);
    } finally {
      dispatch({ type: 'SET_LOADING_BALANCES', payload: false });
    }
  };

  const fetchTransactions = async (params?: { forceUpdate?: boolean }) => {
    const { forceUpdate = false } = params || {};

    if (!state.wallet) {
      throw new Error('Wallet not found');
    }

    if (!state.addresses) {
      throw new Error('Addresses not found');
    }

    const enabledAssets = state.wallet.enabledAssets;
    const addressMap = state.addresses;

    // Check if we have cached transactions in state
    if (config.enableCaching && !forceUpdate) {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY_TRANSACTIONS);
        if (stored) {
          const transactionMap: TransactionMap = JSON.parse(stored);
          dispatch({ type: 'SET_TRANSACTIONS', payload: transactionMap });
        }
      } catch (error) {
        console.error('Failed to load cached balances:', error);
      }
    }

    // Set loading state
    dispatch({ type: 'SET_LOADING_TRANSACTIONS', payload: true });

    try {
      // Fetch fresh data
      const transactionMap = await getUpdatedTransactions({
        enabledAssets,
        addressMap,
      });

      // Update state with fresh data
      dispatch({
        type: 'SET_TRANSACTIONS',
        payload: transactionMap,
      });
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      dispatch({ type: 'SET_LOADING_TRANSACTIONS', payload: false });
    }
  };

  const refreshWalletBalance = async () => {
    const balanceMap = await getUpdatedBalances({
      enabledAssets: state.wallet?.enabledAssets || [],
      addressMap: state.addresses || {},
    });
    dispatch({ type: 'SET_BALANCES', payload: balanceMap });
  };

  const refreshTransactions = async () => {
    const transactionMap = await getUpdatedTransactions({
      enabledAssets: state.wallet?.enabledAssets || [],
      addressMap: state.addresses || {},
    });

    dispatch({ type: 'SET_TRANSACTIONS', payload: transactionMap });
  };

  const value: WalletContextType = {
    ...state,
    createWallet,
    clearWallet,
    clearError,
    refreshWalletBalance,
    refreshTransactions,
    unlockWallet,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

// Custom hook to use wallet context
export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

export default WalletContext;
