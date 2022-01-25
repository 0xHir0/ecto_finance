import { useCallback } from 'react';
import useEctoFinance from './useEctoFinance';
import { Bank } from '../ecto-finance';
import useHandleTransactionReceipt from './useHandleTransactionReceipt';

const useZap = (bank: Bank) => {
  const ectoFinance = useEctoFinance();
  const handleTransactionReceipt = useHandleTransactionReceipt();

  const handleZap = useCallback(
    (zappingToken: string, tokenName: string, amount: string) => {
      handleTransactionReceipt(
        ectoFinance.zapIn(zappingToken, tokenName, amount),
        `Zap ${amount} in ${bank.depositTokenName}.`,
      );
    },
    [bank, ectoFinance, handleTransactionReceipt],
  );
  return { onZap: handleZap };
};

export default useZap;
