import { useEffect, useState } from 'react';
import useEctoFinance from './useEctoFinance';
import { TokenStat } from '../ecto-finance/types';
import useRefresh from './useRefresh';

const useCashPriceInEstimatedTWAP = () => {
  const [stat, setStat] = useState<TokenStat>();
  const ectoFinance = useEctoFinance();
  const { slowRefresh } = useRefresh();

  useEffect(() => {
    async function fetchCashPrice() {
      try {
        setStat(await ectoFinance.getEctoStatInEstimatedTWAP());
      } catch (err) {
        console.error(err);
      }
    }
    fetchCashPrice();
  }, [setStat, ectoFinance, slowRefresh]);

  return stat;
};

export default useCashPriceInEstimatedTWAP;
