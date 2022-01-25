import { useEffect, useState } from 'react';
import useEctoFinance from './useEctoFinance';
import { TokenStat } from '../ecto-finance/types';
import useRefresh from './useRefresh';

const useShareStats = () => {
  const [stat, setStat] = useState<TokenStat>();
  const { slowRefresh } = useRefresh();
  const ectoFinance = useEctoFinance();

  useEffect(() => {
    async function fetchSharePrice() {
      try {
        setStat(await ectoFinance.geeShareStat());
      } catch (err) {
        console.error(err);
      }
    }
    fetchSharePrice();
  }, [setStat, ectoFinance, slowRefresh]);

  return stat;
};

export default useShareStats;
