import { useEffect, useState } from 'react';
import useEctoFinance from './../useEctoFinance';
import { AllocationTime } from '../../ecto-finance/types';

const useUnstakeTimerMasonry = () => {
  const [time, setTime] = useState<AllocationTime>({
    from: new Date(),
    to: new Date(),
  });
  const ectoFinance = useEctoFinance();

  useEffect(() => {
    if (ectoFinance) {
      ectoFinance.getUserUnstakeTime().then(setTime);
    }
  }, [ectoFinance]);
  return time;
};

export default useUnstakeTimerMasonry;
