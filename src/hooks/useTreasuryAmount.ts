import { useEffect, useState } from 'react';
import { BigNumber } from 'ethers';
import useEctoFinance from './useEctoFinance';

const useTreasuryAmount = () => {
  const [amount, setAmount] = useState(BigNumber.from(0));
  const ectoFinance = useEctoFinance();

  useEffect(() => {
    if (ectoFinance) {
      const { Treasury } = ectoFinance.contracts;
      ectoFinance.ECTO.balanceOf(Treasury.address).then(setAmount);
    }
  }, [ectoFinance]);
  return amount;
};

export default useTreasuryAmount;
