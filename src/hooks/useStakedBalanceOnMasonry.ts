import { useEffect, useState } from 'react';
import { BigNumber } from 'ethers';
import useEctoFinance from './useEctoFinance';
import useRefresh from './useRefresh';

const useStakedBalanceOnMasonry = () => {
  const { slowRefresh } = useRefresh();
  const [balance, setBalance] = useState(BigNumber.from(0));
  const ectoFinance = useEctoFinance();
  const isUnlocked = ectoFinance?.isUnlocked;
  useEffect(() => {
    async function fetchBalance() {
      try {
        setBalance(await ectoFinance.getStakedSharesOnMasonry());
      } catch (e) {
        console.error(e);
      }
    }
    if (isUnlocked) {
      fetchBalance();
    }
  }, [slowRefresh, isUnlocked, ectoFinance]);
  return balance;
};

export default useStakedBalanceOnMasonry;
