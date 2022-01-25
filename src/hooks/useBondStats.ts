import { useEffect, useState } from 'react';
import useEctoFinance from './useEctoFinance';
import { TokenStat } from '../ecto-finance/types';
import useRefresh from './useRefresh';

const useBondStats = () => {
  const [stat, setStat] = useState<TokenStat>();
  const { slowRefresh } = useRefresh();
  const ectoFinance = useEctoFinance();

  useEffect(() => {
    async function fetchBondPrice() {
      try {
        setStat(await ectoFinance.getBondStat());
      } catch (err) {
        console.error(err);
      }
    }
    fetchBondPrice();
  }, [setStat, ectoFinance, slowRefresh]);

  return stat;
};

export default useBondStats;
