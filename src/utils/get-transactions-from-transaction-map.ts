import type {
  Transaction,
  TransactionMap,
} from '../services/wdk-service/types';

const getTransactionsFromTransactionMap = (
  transactionMap: TransactionMap
): Transaction[] => {
  const transactions: Transaction[] = Object.entries(transactionMap).reduce(
    (allTransactions, [_, txArray]) => {
      return allTransactions.concat(txArray);
    },
    [] as Transaction[]
  );
  return transactions;
};

export default getTransactionsFromTransactionMap;
