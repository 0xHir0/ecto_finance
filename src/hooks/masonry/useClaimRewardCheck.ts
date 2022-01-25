import { useEffect, useState } from 'react';
import useRefresh from '../useRefresh';
import useEctoFinance from './../useEctoFinance';

const useClaimRewardCheck = () => {
  const { slowRefresh } = useRefresh();
  const [canClaimReward, setCanClaimReward] = useState(false);
  const ectoFinance = useEctoFinance();
  const isUnlocked = ectoFinance?.isUnlocked;

  useEffect(() => {
    async function canUserClaimReward() {
      try {
        setCanClaimReward(await ectoFinance.canUserClaimRewardFromMasonry());
      } catch (err) {
        console.error(err);
      }
    }
    if (isUnlocked) {
      canUserClaimReward();
    }
  }, [isUnlocked, slowRefresh, ectoFinance]);

  return canClaimReward;
};

export default useClaimRewardCheck;
