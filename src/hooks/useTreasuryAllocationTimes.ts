import { useEffect, useState } from 'react';
import useEctoFinance from './useEctoFinance';
import { AllocationTime } from '../ecto-finance/types';
import useRefresh from './useRefresh';

const useTreasuryAllocationTimes = () => {
  const { slowRefresh } = useRefresh();
  const [time, setTime] = useState<AllocationTime>({
    from: new Date(),
    to: new Date(),
  });
  const ectoFinance = useEctoFinance();
  useEffect(() => {
    if (ectoFinance) {
      ectoFinance.getTreasuryNextAllocationTime().then(setTime);
    }
  }, [ectoFinance, slowRefresh]);
  return time;
};

export default useTreasuryAllocationTimes;
