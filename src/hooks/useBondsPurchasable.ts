import { useCallback, useEffect, useState } from 'react';
import { BigNumber } from 'ethers';
import ERC20 from '../ecto-finance/ERC20';
import useEctoFinance from './useEctoFinance';
import config from '../config';

const useBondsPurchasable = () => {
  const [balance, setBalance] = useState(BigNumber.from(0));
  const ectoFinance = useEctoFinance();

  useEffect(() => {
    async function fetchBondsPurchasable() {
      try {
        setBalance(await ectoFinance.getBondsPurchasable());
      } catch (err) {
        console.error(err);
      }
    }
    fetchBondsPurchasable();
  }, [setBalance, ectoFinance]);

  return balance;
};

export default useBondsPurchasable;
