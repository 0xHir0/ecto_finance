import { useCallback, useState, useEffect } from 'react';
import useEctoFinance from './useEctoFinance';
import { Bank } from '../ecto-finance';
import { PoolStats } from '../ecto-finance/types';
import config from '../config';

const useStatsForPool = (bank: Bank) => {
  const ectoFinance = useEctoFinance();

  const [poolAPRs, setPoolAPRs] = useState<PoolStats>();

  const fetchAPRsForPool = useCallback(async () => {
    setPoolAPRs(await ectoFinance.getPoolAPRs(bank));
  }, [ectoFinance, bank]);

  useEffect(() => {
    fetchAPRsForPool().catch((err) => console.error(`Failed to fetch EBOND price: ${err.stack}`));
    const refreshInterval = setInterval(fetchAPRsForPool, config.refreshInterval);
    return () => clearInterval(refreshInterval);
  }, [setPoolAPRs, ectoFinance, fetchAPRsForPool]);

  return poolAPRs;
};

export default useStatsForPool;
