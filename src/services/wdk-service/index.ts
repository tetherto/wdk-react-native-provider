import { HRPC as WdkManager } from '@tetherto/pear-wrk-wdk';
// @ts-expect-error - bundle file doesn't have type definitions
import wdkWorkletBundle from './wdk-worklet.mobile.bundle.js';
import b4a from 'b4a';
import * as bip39 from 'bip39';
import Decimal from 'decimal.js';
// @ts-expect-error - bundle file doesn't have type definitions
import secretManagerWorkletBundle from './wdk-secret-manager-worklet.bundle.js';
import { BareWorkletApi, InstanceEnum } from './bare-api';
import type { ChainsConfig, Transaction, Wallet } from './types';
import {
  AssetAddressMap,
  AssetBalanceMap,
  AssetTicker,
  NetworkType,
} from './types';
import { wdkEncryptionSalt } from './wdk-encryption-salt';
import {
  WDK_STORAGE_ENTROPY,
  WDK_STORAGE_SALT,
  WDK_STORAGE_SEED,
  WdkSecretManagerStorage,
} from './wdk-secret-manager-storage';

export const SMART_CONTRACT_BALANCE_ADDRESSES = {
  [AssetTicker.USDT]: {
    ethereum: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    polygon: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
    arbitrum: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
    ton: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
    plasma: '0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb',
  },
  [AssetTicker.XAUT]: {
    ethereum: '0x68749665FF8D2d112Fa859AA293F07A622782F38',
    polygon: '0xF1815bd50389c46847f0Bda824eC8da914045D14',
    arbitrum: '0x40461291347e1eCbb09499F3371D3f17f10d7159',
    ton: 'EQA1R_LuQCLHlMgOo1S4G7Y7W1cd0FrAkbA10Zq7rddKxi9k',
    plasma: '0x1B64B9025EEbb9A6239575dF9Ea4b9Ac46D4d193',
  },
};

const toNetwork = (n: NetworkType): string => {
  switch (n) {
    case NetworkType.SEGWIT:
      return 'bitcoin';
    case NetworkType.ETHEREUM:
      return 'ethereum';
    case NetworkType.TON:
      return 'ton';
    case NetworkType.POLYGON:
      return 'polygon';
    case NetworkType.ARBITRUM:
      return 'arbitrum';
    case NetworkType.PLASMA:
      return 'plasma';
    case NetworkType.SOLANA:
      return 'solana';
    case NetworkType.TRON:
      return 'tron';
    default:
      return 'bitcoin';
  }
};

interface WalletCache {
  wdk: WdkManager;
  data: Wallet;
}

interface WDKServiceConfig {
  indexer: {
    apiKey: string;
    url: string;
    version: string;
  };
  chains: ChainsConfig;
}

class WDKService {
  private static instance: WDKService;
  private walletManagerCache: Map<string, WalletCache> = new Map();
  private isInitialized = false;
  private wdkManager: WdkManager | null = null;
  private secretManager: any | null = null;
  private config: WDKServiceConfig | undefined;

  private constructor() {}

  static getInstance(): WDKService {
    if (!WDKService.instance) {
      WDKService.instance = new WDKService();
    }
    return WDKService.instance;
  }

  setConfig(config: WDKServiceConfig): void {
    this.config = { ...this.config, ...config };
  }

  private getIndexerUrl(): string {
    if (!this.config) {
      throw new Error('WDK Service config not set');
    }

    return this.config.indexer.url;
  }

  private getIndexerVersion(): string {
    if (!this.config) {
      throw new Error('WDK Service config not set');
    }

    return this.config.indexer.version;
  }

  private getIndexerApiKey(): string {
    if (!this.config) {
      throw new Error('WDK Service config not set');
    }

    return this.config.indexer.apiKey;
  }

  private getChainsConfig(): any {
    if (!this.config) {
      throw new Error('WDK Service config not set');
    }

    if (!this.config.chains) {
      throw new Error('Chains config not set');
    }

    return this.config.chains;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Start both worklets
      BareWorkletApi.startWorklet(
        InstanceEnum.wdkSecretManager,
        '/secret.manager.worklet.bundle',
        secretManagerWorkletBundle
      );
      BareWorkletApi.startWorklet(
        InstanceEnum.wdkManager,
        '/wdk.manager.worklet.bundle',
        wdkWorkletBundle
      );

      await new Promise((resolve) => setTimeout(resolve, 200));

      // Verify both HRPC instances are available
      this.secretManager = BareWorkletApi.hrpcInstances.wdkSecretManager;
      this.wdkManager = BareWorkletApi.hrpcInstances.wdkManager;

      if (!this.secretManager) {
        throw new Error(
          'Failed to initialize WDK Secret Manager HRPC instance'
        );
      }

      if (!this.wdkManager) {
        throw new Error('Failed to initialize WDK Manager HRPC instance');
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize WDK services:', error);
      this.isInitialized = false;
      throw error;
    }
  }

  async clearWallet(): Promise<void> {
    try {
      // 1. Gracefully stop worklet operations if they're running
      if (this.wdkManager) {
        try {
          await this.wdkManager.workletStop();
        } catch (error) {
          // Worklet might not be started, ignore
          console.warn('Could not stop wdkManager worklet:', error);
        }
      }

      if (this.secretManager) {
        try {
          await this.secretManager.commandWorkletStop();
        } catch (error) {
          // Worklet might not be started, ignore
          console.warn('Could not stop secretManager worklet:', error);
        }
      }

      // 3. Clear all keychain storage (entropy, seed, salt)
      await WdkSecretManagerStorage.resetAllData();

      // 4. Reset internal state (but keep worklets alive)
      this.walletManagerCache.clear();

      // Note: We keep this.wdkManager and this.secretManager references intact
      // as the worklets are still running and can be reused
      // We also keep this.isInitialized = true since worklets are still initialized
    } catch (error) {
      console.error('Failed to clear wallet:', error);
      throw error;
    }
  }

  // WDK API Methods
  async createSeed(params: {
    prf: Buffer | ArrayBuffer | string;
  }): Promise<string> {
    try {
      const salt = wdkEncryptionSalt.generateWdkSalt(params.prf);
      const rpc = BareWorkletApi.hrpcInstances.wdkSecretManager;

      const workletStatus = await rpc.commandWorkletStart({
        enableDebugLogs: 0,
      });

      if (workletStatus.status === 'started') {
        const encryptedData = await rpc.commandGenerateAndEncrypt({
          passkey: params.prf,
          salt: b4a.toString(salt, 'hex'),
        });

        await WdkSecretManagerStorage.saveData(
          WDK_STORAGE_ENTROPY,
          encryptedData.encryptedEntropy
        );
        await WdkSecretManagerStorage.saveData(
          WDK_STORAGE_SEED,
          encryptedData.encryptedSeed
        );
        await WdkSecretManagerStorage.saveData(WDK_STORAGE_SALT, salt);

        const decryptedData = await rpc.commandDecrypt({
          passkey: params.prf,
          salt: b4a.toString(salt, 'hex'),
          encryptedData: encryptedData.encryptedEntropy,
        });
        const seed = bip39.entropyToMnemonic(
          b4a.from(decryptedData.result, 'hex') as Buffer
        );
        return seed;
      } else {
        throw new Error('Error while starting the worklet.');
      }
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  async importSeedPhrase(params: {
    prf: Buffer | ArrayBuffer | string;
    seedPhrase: string;
  }): Promise<boolean> {
    try {
      const salt = wdkEncryptionSalt.generateWdkSalt(params.prf);
      const rpc = BareWorkletApi.hrpcInstances.wdkSecretManager;

      const workletStatus = await rpc.commandWorkletStart({
        enableDebugLogs: 0,
      });

      if (workletStatus.status === 'started') {
        const encryptedData = await rpc.commandGenerateAndEncrypt({
          passkey: params.prf,
          salt: b4a.toString(salt, 'hex'),
          seedPhrase: params.seedPhrase,
        });

        await WdkSecretManagerStorage.saveData(
          WDK_STORAGE_ENTROPY,
          encryptedData.encryptedEntropy
        );
        await WdkSecretManagerStorage.saveData(
          WDK_STORAGE_SEED,
          encryptedData.encryptedSeed
        );
        await WdkSecretManagerStorage.saveData(WDK_STORAGE_SALT, salt);
      } else {
        throw new Error('Error while starting the worklet.');
      }
    } catch (error: any) {
      throw new Error(error.message);
    }
    return true;
  }

  async retrieveSeed(
    passkey: Buffer | ArrayBuffer | string
  ): Promise<string | null> {
    let encryptedEntropy:
      | boolean
      | null
      | Buffer<ArrayBufferLike>
      | Uint8Array<ArrayBufferLike> = null;
    let encryptedSeed:
      | Buffer<ArrayBufferLike>
      | Uint8Array<ArrayBufferLike>
      | boolean
      | null = null;
    let salt:
      | Buffer<ArrayBufferLike>
      | Uint8Array<ArrayBufferLike>
      | boolean
      | null = null;

    if (await WdkSecretManagerStorage.hasKey(WDK_STORAGE_ENTROPY)) {
      encryptedEntropy =
        await WdkSecretManagerStorage.retrieveData(WDK_STORAGE_ENTROPY);
    }
    if (await WdkSecretManagerStorage.hasKey(WDK_STORAGE_SEED)) {
      encryptedSeed =
        await WdkSecretManagerStorage.retrieveData(WDK_STORAGE_SEED);
    }
    if (await WdkSecretManagerStorage.hasKey(WDK_STORAGE_SALT)) {
      salt = await WdkSecretManagerStorage.retrieveData(WDK_STORAGE_SALT);
    }

    if (!encryptedSeed || !encryptedEntropy || !salt) {
      return null;
    }

    try {
      const rpc = BareWorkletApi.hrpcInstances.wdkSecretManager;
      const workletStatus = await rpc.commandWorkletStart({
        enableDebugLogs: 0,
      });

      if (workletStatus.status === 'started') {
        const decryptedData = await rpc.commandDecrypt({
          passkey: passkey,
          salt: b4a.toString(salt, 'hex'),
          encryptedData: b4a.toString(encryptedEntropy, 'hex'),
        });
        const seed = bip39.entropyToMnemonic(
          b4a.from(decryptedData.result, 'hex') as Buffer
        );
        return seed;
      } else {
        throw new Error('Error while starting the worklet.');
      }
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  async getAssetAddress(
    network: NetworkType,
    index: number
  ): Promise<{ address: string }> {
    if (!this.wdkManager) {
      throw new Error('WDK Manager not initialized');
    }

    if (network === NetworkType.SEGWIT) {
      return await this.wdkManager.getAddress({
        network: toNetwork(network),
        accountIndex: index,
      });
    } else {
      return await this.wdkManager.getAbstractedAddress({
        network: toNetwork(network),
        accountIndex: index,
      });
    }
  }

  async resolveWalletAddresses(
    enabledAssets: AssetTicker[],
    index: number = 0
  ): Promise<Partial<Record<NetworkType, string>>> {
    if (!this.wdkManager) {
      throw new Error('WDK Manager not initialized');
    }

    const addressPromises = [];
    const networkAddresses: Partial<Record<NetworkType, string>> = {};
    const addressesArr = [];

    for (const asset of enabledAssets) {
      for (const networkType of Object.keys(AssetAddressMap[asset])) {
        addressesArr.push({ [networkType]: null });
        addressPromises.push(
          this.getAssetAddress(networkType as NetworkType, index)
        );
      }
    }

    const addresses = await Promise.allSettled(addressPromises);
    addressesArr.forEach((obj, i) => {
      const key = Object.keys(obj)[0];
      if (addresses[i]?.status === 'fulfilled') {
        // @ts-expect-error
        networkAddresses[key] = (addresses[i] as any).value.address;
      } else {
        // @ts-expect-error
        networkAddresses[key] = null;
        console.error(
          `Error while resolving wallet address ${key} - err - ${(addresses[i] as any).reason}`
        );
      }
    });

    networkAddresses[NetworkType.POLYGON] =
      networkAddresses[NetworkType.ETHEREUM];
    networkAddresses[NetworkType.ARBITRUM] =
      networkAddresses[NetworkType.ETHEREUM];
    networkAddresses[NetworkType.PLASMA] =
      networkAddresses[NetworkType.ETHEREUM];

    return networkAddresses;
  }

  async quoteSendByNetwork(
    network: NetworkType,
    index: number,
    amount: number,
    recipientAddress: string,
    asset: AssetTicker
  ) {
    try {
      if (network === NetworkType.SEGWIT) {
        const value = new Decimal(amount)
          .mul(this.getDenominationValue(AssetTicker.BTC))
          .toNumber();
        const quote = await this.wdkManager.quoteSendTransaction({
          network: 'bitcoin',
          accountIndex: index,
          options: {
            to: recipientAddress,
            value: value.toString(),
          },
        });

        return Number(quote.fee) / this.getDenominationValue(AssetTicker.BTC);
      } else if (
        [
          NetworkType.ETHEREUM,
          NetworkType.POLYGON,
          NetworkType.ARBITRUM,
          NetworkType.PLASMA,
          NetworkType.TON,
        ].includes(network)
      ) {
        const sendAmount = 1000;

        const config = {
          paymasterToken: {
            // @ts-expect-error
            address: SMART_CONTRACT_BALANCE_ADDRESSES[asset][network],
          },
        };

        const quote = await this.wdkManager.abstractedAccountQuoteTransfer({
          network: network,
          accountIndex: index,
          options: {
            recipient: recipientAddress,
            // @ts-expect-error
            token: SMART_CONTRACT_BALANCE_ADDRESSES[asset][network],
            amount: sendAmount.toString(),
          },
          config: config,
        });

        return Number(quote.fee) / this.getDenominationValue(AssetTicker.USDT);
      } else {
        throw new Error('Unsupported network');
      }
    } catch (error) {
      const insufficientBalancePatterns = [
        'Insufficient balance',
        'Details: validator: callData reverts',
        'JSON is not a valid request object',
      ];

      if (
        insufficientBalancePatterns.some((pattern) =>
          (error as any)?.message?.includes(pattern)
        )
      ) {
        throw new Error('Insufficient balance');
      }

      throw error;
    }
  }

  async sendByNetwork(
    network: NetworkType,
    index: number,
    amount: number,
    recipientAddress: string,
    asset: AssetTicker
  ): Promise<any> {
    if (!this.wdkManager) {
      throw new Error('WDK Manager not initialized');
    }

    // Check if any wallet exists and the WDK Manager is started with a seed
    const hasWallet = this.walletManagerCache.size > 0;
    if (!hasWallet) {
      throw new Error(
        'No wallet found. Please create or import a wallet first before sending transactions.'
      );
    }

    if (network === NetworkType.SEGWIT) {
      const sendParams = {
        to: recipientAddress,
        value: new Decimal(amount)
          .mul(this.getDenominationValue(AssetTicker.BTC))
          .round()
          .toString(),
      };

      const response = await this.wdkManager.sendTransaction({
        network: network,
        accountIndex: index,
        options: sendParams,
      });

      return response;
    } else if (
      [
        NetworkType.ETHEREUM,
        NetworkType.POLYGON,
        NetworkType.ARBITRUM,
        NetworkType.PLASMA,
        NetworkType.TON,
      ].includes(network)
    ) {
      const sendParams = {
        recipient: recipientAddress,
        // @ts-expect-error
        token: SMART_CONTRACT_BALANCE_ADDRESSES[asset][network],
        amount: new Decimal(amount)
          .mul(this.getDenominationValue(AssetTicker.USDT))
          .round()
          .toString(),
      };

      const config = {
        paymasterToken: {
          // @ts-expect-error
          address: SMART_CONTRACT_BALANCE_ADDRESSES[asset][network],
        },
      };

      const response = await this.wdkManager.abstractedAccountTransfer({
        network: network,
        accountIndex: index,
        options: sendParams,
        config,
      });

      return response;
    } else {
      throw new Error('Unsupported network');
    }
  }

  getDenominationValue(asset: AssetTicker): number {
    switch (asset) {
      case AssetTicker.BTC:
        return 100000000;
      case AssetTicker.USDT:
        return 1000000;
      case AssetTicker.XAUT:
        return 1000000;
      default:
        return 1000000;
    }
  }

  async createWallet(params: {
    walletName: string;
    prf: Buffer | string;
  }): Promise<Wallet> {
    let seed = await this.retrieveSeed(params.prf);

    if (!seed) {
      seed = await this.createSeed(params);
    }

    const walletName = params.walletName;
    const availableAssets = [
      AssetTicker.BTC,
      AssetTicker.USDT,
      AssetTicker.XAUT,
    ];

    const wallet: Wallet = {
      id: `wallet_${Date.now()}`,
      name: walletName,
      enabledAssets: availableAssets,
    };

    const wdkManager = BareWorkletApi.hrpcInstances.wdkManager;
    await wdkManager.workletStart({
      enableDebugLogs: 0,
      seedPhrase: seed,
      config: JSON.stringify(this.getChainsConfig()),
    });

    // Update our local reference
    this.wdkManager = BareWorkletApi.hrpcInstances.wdkManager;

    if (!this.wdkManager) {
      throw new Error('WDK Manager not initialized after wallet creation');
    }

    this.walletManagerCache.set(wallet.id, {
      wdk: this.wdkManager,
      data: wallet,
    });

    return wallet;
  }

  async resolveWalletTransactions(
    enabledAssets: AssetTicker[],
    networkAddresses: Partial<Record<NetworkType, string>>
  ): Promise<Record<string, Transaction[]>> {
    const headers = new Headers();
    headers.append('accept', 'application/json');
    headers.append('x-api-key', this.getIndexerApiKey());
    headers.append('Content-Type', 'application/json');

    const payload: {
      blockchain: string;
      token: AssetTicker;
      address: string;
      limit: number;
      fromTs?: number;
      toTs?: number;
    }[] = [];

    const transactionMap: Record<string, Transaction[]> = {};
    const payloadKeys: string[] = []; // Track the keys in order to match with response array

    enabledAssets.forEach((asset) => {
      const networks = AssetBalanceMap[asset];
      if (!networks) return;

      Object.keys(networks).forEach((networkType) => {
        const key = `${networkType}_${asset}`;
        transactionMap[key] = [];

        const address = networkAddresses[networkType as NetworkType];

        if (address) {
          payload.push({
            blockchain: networkType,
            token: asset,
            address,
            limit: 100,
          });
          payloadKeys.push(key); // Track which key this payload corresponds to
        }
      });
    });

    const requestOptions = {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload),
    };

    const response = await fetch(
      `${this.getIndexerUrl()}/api/${this.getIndexerVersion()}/batch/token-transfers`,
      requestOptions
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch transactions: ${response.status}`);
    }

    const data = await response.json();

    // Process the batch response array - each element corresponds to a payload item by index
    (data as Array<{ transfers: Transaction[] }>).forEach((item, index) => {
      const key = payloadKeys[index];
      if (key) {
        transactionMap[key] = item.transfers || [];
      }
    });

    return transactionMap;
  }

  async resolveWalletBalances(
    enabledAssets: AssetTicker[],
    networkAddresses: Partial<Record<NetworkType, string>>
  ): Promise<
    Record<
      string,
      {
        balance: number;
        asset: AssetTicker;
      }
    >
  > {
    const headers = new Headers();
    headers.append('accept', 'application/json');
    headers.append('x-api-key', this.getIndexerApiKey());
    headers.append('Content-Type', 'application/json');

    const payload: {
      blockchain: string;
      token: AssetTicker;
      address: string;
    }[] = [];

    enabledAssets.forEach((asset) => {
      const networks = AssetBalanceMap[asset];
      if (!networks) return;

      Object.keys(networks).forEach((networkType) => {
        const address = networkAddresses[networkType as NetworkType];
        if (address) {
          payload.push({
            blockchain: networkType,
            token: asset,
            address,
          });
        }
      });
    });

    const requestOptions = {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload),
    };

    const response = await fetch(
      `${this.getIndexerUrl()}/api/${this.getIndexerVersion()}/batch/token-balances`,
      requestOptions
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch balances: ${response.status}`);
    }

    const data = await response.json();

    const balanceMap = Object.entries(
      data as Record<
        string,
        { tokenBalance: { amount: number; blockchain: string; token: string } }
      >
    ).reduce(
      (allBalances, [_, value]) => {
        const obj = (value as any).tokenBalance;
        allBalances[`${obj.blockchain}_${obj.token}`] = {
          balance: parseFloat(obj.amount),
          asset: obj.token as AssetTicker,
        };
        return allBalances;
      },
      {} as Record<string, { balance: number; asset: AssetTicker }>
    );

    return balanceMap;
  }
}

export const wdkService = WDKService.getInstance();

export { wdkService as WDKService };
