import { useCallback, useEffect, useState } from 'react';

import { BigNumber } from 'ethers';
import useEctoFinance from './useEctoFinance';
import { ContractName } from '../ecto-finance';
import config from '../config';

const useStakedBalance = (poolName: ContractName, poolId: Number) => {
  const [balance, setBalance] = useState(BigNumber.from(0));
  const ectoFinance = useEctoFinance();
  const isUnlocked = ectoFinance?.isUnlocked;

  const fetchBalance = useCallback(async () => {
    const balance = await ectoFinance.stakedBalanceOnBank(poolName, poolId, ectoFinance.myAccount);
    setBalance(balance);
  }, [poolName, poolId, ectoFinance]);

  useEffect(() => {
    if (isUnlocked) {
      fetchBalance().catch((err) => console.error(err.stack));

      const refreshBalance = setInterval(fetchBalance, config.refreshInterval);
      return () => clearInterval(refreshBalance);
    }
  }, [isUnlocked, poolName, setBalance, ectoFinance, fetchBalance]);

  return balance;
};

export default useStakedBalance;
