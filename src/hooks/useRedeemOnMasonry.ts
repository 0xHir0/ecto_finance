import { useCallback } from 'react';
import useEctoFinance from './useEctoFinance';
import useHandleTransactionReceipt from './useHandleTransactionReceipt';

const useRedeemOnMasonry = (description?: string) => {
  const ectoFinance = useEctoFinance();
  const handleTransactionReceipt = useHandleTransactionReceipt();

  const handleRedeem = useCallback(() => {
    const alertDesc = description || 'Redeem ESHARE from Masonry';
    handleTransactionReceipt(ectoFinance.exitFromMasonry(), alertDesc);
  }, [ectoFinance, description, handleTransactionReceipt]);
  return { onRedeem: handleRedeem };
};

export default useRedeemOnMasonry;
