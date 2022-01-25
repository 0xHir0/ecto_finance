import { useEffect, useState } from 'react';
import useEctoFinance from './useEctoFinance';
import { LPStat } from '../ecto-finance/types';
import useRefresh from './useRefresh';

const useLpStats = (lpTicker: string) => {
  const [stat, setStat] = useState<LPStat>();
  const { slowRefresh } = useRefresh();
  const ectoFinance = useEctoFinance();

  useEffect(() => {
    async function fetchLpPrice() {
      try {
        setStat(await ectoFinance.getLPStat(lpTicker));
      } catch (err) {
        console.error(err);
      }
    }
    fetchLpPrice();
  }, [setStat, ectoFinance, slowRefresh, lpTicker]);

  return stat;
};

export default useLpStats;
