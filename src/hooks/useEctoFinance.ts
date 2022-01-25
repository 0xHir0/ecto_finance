import { useContext } from 'react';
import { Context } from '../contexts/EctoFinanceProvider';

const useEctoFinance = () => {
  const { ectoFinance } = useContext(Context);
  return ectoFinance;
};

export default useEctoFinance;
