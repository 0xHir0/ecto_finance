import { useCallback, useEffect, useState } from 'react';
import useEctoFinance from './useEctoFinance';
import useStakedBalanceOnMasonry from './useStakedBalanceOnMasonry';

const useMasonryVersion = () => {
  const [masonryVersion, setMasonryVersion] = useState('latest');
  const ectoFinance = useEctoFinance();
  const stakedBalance = useStakedBalanceOnMasonry();

  const updateState = useCallback(async () => {
    setMasonryVersion(await ectoFinance.fetchMasonryVersionOfUser());
  }, [ectoFinance?.isUnlocked, stakedBalance]);

  useEffect(() => {
    if (ectoFinance?.isUnlocked) {
      updateState().catch((err) => console.error(err.stack));
    }
  }, [ectoFinance?.isUnlocked, stakedBalance]);

  return masonryVersion;
};

export default useMasonryVersion;
