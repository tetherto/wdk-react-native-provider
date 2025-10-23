import type {
  Amount,
  BalanceMap,
  NetworkType,
} from '../services/wdk-service/types';

const getBalancesFromBalanceMap = (balanceMap: BalanceMap): Amount[] => {
  const balances = Object.entries(balanceMap).map(
    ([key, { balance, asset }]) => {
      const [networkType] = key.split('_') as [NetworkType];
      return {
        networkType,
        denomination: asset,
        value: balance.toString(),
      };
    }
  );

  return balances;
};

export default getBalancesFromBalanceMap;
