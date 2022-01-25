import { useEffect, useState } from 'react';
import useEctoFinance from './useEctoFinance';
import { TokenStat } from '../ecto-finance/types';
import useRefresh from './useRefresh';

const useEctoStats = () => {
  const [stat, setStat] = useState<TokenStat>();
  const { fastRefresh } = useRefresh();
  const ectoFinance = useEctoFinance();

  useEffect(() => {
    async function fetchEctoPrice() {
      try {
        setStat(await ectoFinance.getEctoStat());
      } catch (err) {
        console.error(err);
      }
    }
    fetchEctoPrice();
  }, [setStat, ectoFinance, fastRefresh]);

  return stat;
};

export default useEctoStats;
