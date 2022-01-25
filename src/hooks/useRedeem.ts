import { useCallback } from 'react';
import useEctoFinance from './useEctoFinance';
import { Bank } from '../ecto-finance';
import useHandleTransactionReceipt from './useHandleTransactionReceipt';

const useRedeem = (bank: Bank) => {
  const ectoFinance = useEctoFinance();
  const handleTransactionReceipt = useHandleTransactionReceipt();

  const handleRedeem = useCallback(() => {
    handleTransactionReceipt(ectoFinance.exit(bank.contract, bank.poolId), `Redeem ${bank.contract}`);
  }, [bank, ectoFinance, handleTransactionReceipt]);

  return { onRedeem: handleRedeem };
};

export default useRedeem;
