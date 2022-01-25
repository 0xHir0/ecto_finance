import { useCallback } from 'react';
import useEctoFinance from './useEctoFinance';
import useHandleTransactionReceipt from './useHandleTransactionReceipt';

const useStakeToMasonry = () => {
  const ectoFinance = useEctoFinance();
  const handleTransactionReceipt = useHandleTransactionReceipt();

  const handleStake = useCallback(
    (amount: string) => {
      handleTransactionReceipt(ectoFinance.stakeShareToMasonry(amount), `Stake ${amount} ESHARE to the masonry`);
    },
    [ectoFinance, handleTransactionReceipt],
  );
  return { onStake: handleStake };
};

export default useStakeToMasonry;
