import { useEffect, useState } from 'react';
import useEctoFinance from './useEctoFinance';
import useRefresh from './useRefresh';

const useTotalValueLocked = () => {
  const [totalValueLocked, setTotalValueLocked] = useState<Number>(0);
  const { slowRefresh } = useRefresh();
  const ectoFinance = useEctoFinance();

  useEffect(() => {
    async function fetchTVL() {
      try {
        setTotalValueLocked(await ectoFinance.getTotalValueLocked());
      } catch (err) {
        console.error(err);
      }
    }
    fetchTVL();
  }, [setTotalValueLocked, ectoFinance, slowRefresh]);

  return totalValueLocked;
};

export default useTotalValueLocked;
