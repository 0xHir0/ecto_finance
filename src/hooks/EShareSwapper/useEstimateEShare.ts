import { useCallback, useEffect, useState } from 'react';
import useEctoFinance from '../useEctoFinance';
import { useWallet } from 'use-wallet';
import { BigNumber } from 'ethers';
import { parseUnits } from 'ethers/lib/utils';

const useEstimateEShare = (tbondAmount: string) => {
  const [estimateAmount, setEstimateAmount] = useState<string>('');
  const { account } = useWallet();
  const ectoFinance = useEctoFinance();

  const estimateAmountOfEShare = useCallback(async () => {
    const tbondAmountBn = parseUnits(tbondAmount);
    const amount = await ectoFinance.estimateAmountOfEShare(tbondAmountBn.toString());
    setEstimateAmount(amount);
  }, [account]);

  useEffect(() => {
    if (account) {
      estimateAmountOfEShare().catch((err) => console.error(`Failed to get estimateAmountOfEShare: ${err.stack}`));
    }
  }, [account, estimateAmountOfEShare]);

  return estimateAmount;
};

export default useEstimateEShare;
