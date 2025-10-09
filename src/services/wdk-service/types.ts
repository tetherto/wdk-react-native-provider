export enum AssetTicker {
  BTC = 'btc',
  USDT = 'usdt',
  XAUT = 'xaut',
}

export enum NetworkType {
  SEGWIT = 'bitcoin',
  LIGHTNING = 'lightning',
  ETHEREUM = 'ethereum',
  SOLANA = 'solana',
  TRON = 'tron',
  TON = 'ton',
  POLYGON = 'polygon',
  ARBITRUM = 'arbitrum',
}

export const AssetAddressMap = {
  [AssetTicker.BTC]: {
    [NetworkType.SEGWIT]: 'bitcoin',
  },
  [AssetTicker.USDT]: {
    [NetworkType.ETHEREUM]: 'ethereum',
    [NetworkType.POLYGON]: 'polygon',
    [NetworkType.ARBITRUM]: 'arbitrum',
    [NetworkType.TON]: 'ton',
  },
  [AssetTicker.XAUT]: {
    [NetworkType.ETHEREUM]: 'ethereum',
    // [NetworkType.TON]: 'ton',
  },
};

export const AssetBalanceMap = {
  [AssetTicker.BTC]: {
    [NetworkType.SEGWIT]: 'bitcoin',
  },
  [AssetTicker.USDT]: {
    [NetworkType.ETHEREUM]: 'ethereum',
    [NetworkType.POLYGON]: 'polygon',
    [NetworkType.ARBITRUM]: 'arbitrum',
    [NetworkType.TON]: 'ton',
  },
  [AssetTicker.XAUT]: {
    [NetworkType.ETHEREUM]: 'ethereum',
    [NetworkType.POLYGON]: 'polygon',
    [NetworkType.ARBITRUM]: 'arbitrum',
    [NetworkType.TON]: 'ton',
  },
};

export interface Amount {
  denomination: AssetTicker;
  value: string;
  networkType: NetworkType;
}

export interface Wallet {
  id: string;
  name: string;
  enabledAssets: AssetTicker[];
}

export interface AccountData {
  addresses: Address[];
  balances: Amount[];
  addressMap: Partial<Record<NetworkType, string>>;
  balanceMap: Partial<Record<NetworkType, number>>;
  transactions: Transaction[];
  transactionMap: Record<string, Transaction[]>;
}

export interface Transaction {
  blockchain: string;
  blockNumber: number;
  transactionHash: string;
  transferIndex: number;
  token: string;
  amount: string;
  timestamp: number;
  transactionIndex: number;
  logIndex: number;
  from: string;
  to: string;
}

export interface Address {
  asset?: AssetTicker;
  networkType: NetworkType;
  value: string;
}

export interface InitializeAccountParams {
  walletId: string;
  accountIndex: number;
}
