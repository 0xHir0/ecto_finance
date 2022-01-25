import { useCallback } from 'react';
import useEctoFinance from './useEctoFinance';
import useHandleTransactionReceipt from './useHandleTransactionReceipt';

const useWithdrawFromMasonry = () => {
  const ectoFinance = useEctoFinance();
  const handleTransactionReceipt = useHandleTransactionReceipt();

  const handleWithdraw = useCallback(
    (amount: string) => {
      handleTransactionReceipt(
        ectoFinance.withdrawShareFromMasonry(amount),
        `Withdraw ${amount} ESHARE from the masonry`,
      );
    },
    [ectoFinance, handleTransactionReceipt],
  );
  return { onWithdraw: handleWithdraw };
};

export default useWithdrawFromMasonry;
