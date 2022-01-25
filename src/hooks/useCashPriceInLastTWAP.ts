import { useCallback, useEffect, useState } from 'react';
import useEctoFinance from './useEctoFinance';
import config from '../config';
import { BigNumber } from 'ethers';

const useCashPriceInLastTWAP = () => {
  const [price, setPrice] = useState<BigNumber>(BigNumber.from(0));
  const ectoFinance = useEctoFinance();

  const fetchCashPrice = useCallback(async () => {
    setPrice(await ectoFinance.Ecto());
  }, [ectoFinance]);

  useEffect(() => {
    fetchCashPrice().catch((err) => console.error(`Failed to fetch ECTO price: ${err.stack}`));
    const refreshInterval = setInterval(fetchCashPrice, config.refreshInterval);
    return () => clearInterval(refreshInterval);
  }, [setPrice, ectoFinance, fetchCashPrice]);

  return price;
};

export default useCashPriceInLastTWAP;
