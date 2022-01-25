import { useCallback } from 'react';
import useEctoFinance from '../useEctoFinance';
import useHandleTransactionReceipt from '../useHandleTransactionReceipt';
// import { BigNumber } from "ethers";
import { parseUnits } from 'ethers/lib/utils';

const useSwapEBondToEShare = () => {
  const ectoFinance = useEctoFinance();
  const handleTransactionReceipt = useHandleTransactionReceipt();

  const handleSwapEShare = useCallback(
    (tbondAmount: string) => {
      const tbondAmountBn = parseUnits(tbondAmount, 18);
      handleTransactionReceipt(ectoFinance.swapEBondToEShare(tbondAmountBn), `Swap ${tbondAmount} EBond to EShare`);
    },
    [ectoFinance, handleTransactionReceipt],
  );
  return { onSwapEShare: handleSwapEShare };
};

export default useSwapEBondToEShare;
