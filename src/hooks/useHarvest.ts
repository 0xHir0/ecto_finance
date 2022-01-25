import { useCallback } from 'react';
import useEctoFinance from './useEctoFinance';
import useHandleTransactionReceipt from './useHandleTransactionReceipt';
import { Bank } from '../ecto-finance';

const useHarvest = (bank: Bank) => {
  const ectoFinance = useEctoFinance();
  const handleTransactionReceipt = useHandleTransactionReceipt();

  const handleReward = useCallback(() => {
    handleTransactionReceipt(
      ectoFinance.harvest(bank.contract, bank.poolId),
      `Claim ${bank.earnTokenName} from ${bank.contract}`,
    );
  }, [bank, ectoFinance, handleTransactionReceipt]);

  return { onReward: handleReward };
};

export default useHarvest;
