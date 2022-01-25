import { useCallback } from 'react';
import useEctoFinance from './useEctoFinance';
import useHandleTransactionReceipt from './useHandleTransactionReceipt';
import { parseUnits } from 'ethers/lib/utils';
import { TAX_OFFICE_ADDR } from '../utils/constants';

const useProvideEctoFtmLP = () => {
  const ectoFinance = useEctoFinance();
  const handleTransactionReceipt = useHandleTransactionReceipt();

  const handleProvideEctoFtmLP = useCallback(
    (ftmAmount: string, ectoAmount: string) => {
      const ectoAmountBn = parseUnits(ectoAmount);
      handleTransactionReceipt(
        ectoFinance.provideEctoFtmLP(ftmAmount, ectoAmountBn),
        `Provide Ecto-FTM LP ${ectoAmount} ${ftmAmount} using ${TAX_OFFICE_ADDR}`,
      );
    },
    [ectoFinance, handleTransactionReceipt],
  );
  return { onProvideEctoFtmLP: handleProvideEctoFtmLP };
};

export default useProvideEctoFtmLP;
