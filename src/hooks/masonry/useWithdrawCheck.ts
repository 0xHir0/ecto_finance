import { useEffect, useState } from 'react';
import useEctoFinance from './../useEctoFinance';
import useRefresh from '../useRefresh';

const useWithdrawCheck = () => {
  const [canWithdraw, setCanWithdraw] = useState(false);
  const ectoFinance = useEctoFinance();
  const { slowRefresh } = useRefresh();
  const isUnlocked = ectoFinance?.isUnlocked;

  useEffect(() => {
    async function canUserWithdraw() {
      try {
        setCanWithdraw(await ectoFinance.canUserUnstakeFromMasonry());
      } catch (err) {
        console.error(err);
      }
    }
    if (isUnlocked) {
      canUserWithdraw();
    }
  }, [isUnlocked, ectoFinance, slowRefresh]);

  return canWithdraw;
};

export default useWithdrawCheck;
