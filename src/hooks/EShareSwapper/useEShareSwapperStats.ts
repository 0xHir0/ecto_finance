import { useEffect, useState } from 'react';
import useEctoFinance from '../useEctoFinance';
import { EShareSwapperStat } from '../../ecto-finance/types';
import useRefresh from '../useRefresh';

const useEShareSwapperStats = (account: string) => {
  const [stat, setStat] = useState<EShareSwapperStat>();
  const { fastRefresh /*, slowRefresh*/ } = useRefresh();
  const ectoFinance = useEctoFinance();

  useEffect(() => {
    async function fetchEShareSwapperStat() {
      try {
        if (ectoFinance.myAccount) {
          setStat(await ectoFinance.getEShareSwapperStat(account));
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchEShareSwapperStat();
  }, [setStat, ectoFinance, fastRefresh, account]);

  return stat;
};

export default useEShareSwapperStats;
