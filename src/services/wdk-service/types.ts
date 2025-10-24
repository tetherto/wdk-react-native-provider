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
  PLASMA = 'plasma',
}

export const AssetAddressMap = {
  [AssetTicker.BTC]: {
    [NetworkType.SEGWIT]: 'bitcoin',
  },
  [AssetTicker.USDT]: {
    [NetworkType.ETHEREUM]: 'ethereum',
    [NetworkType.POLYGON]: 'polygon',
    [NetworkType.ARBITRUM]: 'arbitrum',
    [NetworkType.PLASMA]: 'plasma',
    [NetworkType.TON]: 'ton',
  },
  [AssetTicker.XAUT]: {
    [NetworkType.ETHEREUM]: 'ethereum',
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
    [NetworkType.PLASMA]: 'plasma',
    [NetworkType.TON]: 'ton',
  },
  [AssetTicker.XAUT]: {
    [NetworkType.ETHEREUM]: 'ethereum',
    [NetworkType.PLASMA]: 'plasma',
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

export type AddressMap = Partial<Record<NetworkType, string>>;
export type BalanceMap = Record<
  string,
  { balance: number; asset: AssetTicker }
>;
export type TransactionMap = Partial<Record<NetworkType, Transaction[]>>;

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

export interface PaymasterToken {
  address: string;
}

export interface EVMChainConfig {
  chainId: number;
  blockchain: string;
  provider: string;
  bundlerUrl: string;
  paymasterUrl: string;
  paymasterAddress: string;
  entrypointAddress: string;
  transferMaxFee: number;
  swapMaxFee: number;
  bridgeMaxFee: number;
  paymasterToken: PaymasterToken;
  safeModulesVersion?: string;
}

export interface TONChainConfig {
  tonApiClient: {
    url: string;
  };
  tonClient: {
    url: string;
  };
  paymasterToken: PaymasterToken;
  transferMaxFee: number;
}

export interface BitcoinChainConfig {
  host: string;
  port: number;
}

export interface TronChainConfig {
  chainId: number;
  provider: string;
  gasFreeProvider: string;
  apiKey: string;
  apiSecret: string;
  serviceProvider: string;
  verifyingContract: string;
  transferMaxFee: number;
  swapMaxFee: number;
  bridgeMaxFee: number;
  paymasterToken: PaymasterToken;
}

export interface ChainsConfig {
  ethereum?: EVMChainConfig;
  arbitrum?: EVMChainConfig;
  polygon?: EVMChainConfig;
  plasma?: EVMChainConfig;
  bitcoin?: BitcoinChainConfig;
  tron?: TronChainConfig;
  ton?: TONChainConfig;
}
