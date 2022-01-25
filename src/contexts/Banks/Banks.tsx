import React, { useCallback, useEffect, useState } from 'react';
import Context from './context';
import useEctoFinance from '../../hooks/useEctoFinance';
import { Bank } from '../../ecto-finance';
import config, { bankDefinitions } from '../../config';

const Banks: React.FC = ({ children }) => {
  const [banks, setBanks] = useState<Bank[]>([]);
  const ectoFinance = useEctoFinance();
  const isUnlocked = ectoFinance?.isUnlocked;

  const fetchPools = useCallback(async () => {
    const banks: Bank[] = [];

    for (const bankInfo of Object.values(bankDefinitions)) {
      if (bankInfo.finished) {
        if (!ectoFinance.isUnlocked) continue;

        // only show pools staked by user
        const balance = await ectoFinance.stakedBalanceOnBank(
          bankInfo.contract,
          bankInfo.poolId,
          ectoFinance.myAccount,
        );
        if (balance.lte(0)) {
          continue;
        }
      }
      banks.push({
        ...bankInfo,
        address: config.deployments[bankInfo.contract].address,
        depositToken: ectoFinance.externalTokens[bankInfo.depositTokenName],
        earnToken: bankInfo.earnTokenName === 'ECTO' ? ectoFinance.ECTO : ectoFinance.ESHARE,
      });
    }
    banks.sort((a, b) => (a.sort > b.sort ? 1 : -1));
    setBanks(banks);
  }, [ectoFinance, setBanks]);

  useEffect(() => {
    if (ectoFinance) {
      fetchPools().catch((err) => console.error(`Failed to fetch pools: ${err.stack}`));
    }
  }, [isUnlocked, ectoFinance, fetchPools]);

  return <Context.Provider value={{ banks }}>{children}</Context.Provider>;
};

export default Banks;
