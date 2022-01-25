import { useEffect, useState } from 'react';
import useEctoFinance from '../useEctoFinance';
import { AllocationTime } from '../../ecto-finance/types';

const useClaimRewardTimerMasonry = () => {
  const [time, setTime] = useState<AllocationTime>({
    from: new Date(),
    to: new Date(),
  });
  const ectoFinance = useEctoFinance();

  useEffect(() => {
    if (ectoFinance) {
      ectoFinance.getUserClaimRewardTime().then(setTime);
    }
  }, [ectoFinance]);
  return time;
};

export default useClaimRewardTimerMasonry;
