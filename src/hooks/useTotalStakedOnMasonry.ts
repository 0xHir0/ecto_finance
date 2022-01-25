import { useEffect, useState } from 'react';
import { BigNumber } from 'ethers';
import useEctoFinance from './useEctoFinance';
import useRefresh from './useRefresh';

const useTotalStakedOnMasonry = () => {
  const [totalStaked, setTotalStaked] = useState(BigNumber.from(0));
  const ectoFinance = useEctoFinance();
  const { slowRefresh } = useRefresh();
  const isUnlocked = ectoFinance?.isUnlocked;

  useEffect(() => {
    async function fetchTotalStaked() {
      try {
        setTotalStaked(await ectoFinance.getTotalStakedInMasonry());
      } catch (err) {
        console.error(err);
      }
    }
    if (isUnlocked) {
      fetchTotalStaked();
    }
  }, [isUnlocked, slowRefresh, ectoFinance]);

  return totalStaked;
};

export default useTotalStakedOnMasonry;
