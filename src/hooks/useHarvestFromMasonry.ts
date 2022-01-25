import { useCallback } from 'react';
import useEctoFinance from './useEctoFinance';
import useHandleTransactionReceipt from './useHandleTransactionReceipt';

const useHarvestFromMasonry = () => {
  const ectoFinance = useEctoFinance();
  const handleTransactionReceipt = useHandleTransactionReceipt();

  const handleReward = useCallback(() => {
    handleTransactionReceipt(ectoFinance.harvestCashFromMasonry(), 'Claim ECTO from Masonry');
  }, [ectoFinance, handleTransactionReceipt]);

  return { onReward: handleReward };
};

export default useHarvestFromMasonry;
