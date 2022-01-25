import React, { createContext, useEffect, useState } from 'react';
import { useWallet } from 'use-wallet';
import EctoFinance from '../../ecto-finance';
import config from '../../config';

export interface EctoFinanceContexct {
  ectoFinance?: EctoFinance;
}

export const Context = createContext<EctoFinanceContexct>({ ectoFinance: null });

export const EctoFinanceProvider: React.FC = ({ children }) => {
  const { ethereum, account } = useWallet();
  const [ectoFinance, setEctoFinance] = useState<EctoFinance>();

  useEffect(() => {
    if (!ectoFinance) {
      const ecto = new EctoFinance(config);
      if (account) {
        // wallet was unlocked at initialization
        ecto.unlockWallet(ethereum, account);
      }
      setEctoFinance(ecto);
    } else if (account) {
      ectoFinance.unlockWallet(ethereum, account);
    }
  }, [account, ethereum, ectoFinance]);

  return <Context.Provider value={{ ectoFinance }}>{children}</Context.Provider>;
};
