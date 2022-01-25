import { useEffect, useState } from 'react';
import useEctoFinance from './useEctoFinance';
import useRefresh from './useRefresh';

const useFetchMasonryAPR = () => {
  const [apr, setApr] = useState<number>(0);
  const ectoFinance = useEctoFinance();
  const { slowRefresh } = useRefresh();

  useEffect(() => {
    async function fetchMasonryAPR() {
      try {
        setApr(await ectoFinance.getMasonryAPR());
      } catch (err) {
        console.error(err);
      }
    }
    fetchMasonryAPR();
  }, [setApr, ectoFinance, slowRefresh]);

  return apr;
};

export default useFetchMasonryAPR;
