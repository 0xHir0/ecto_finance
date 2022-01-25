import React, { useMemo, useState } from 'react';
import Page from '../../components/Page';
import { createGlobalStyle } from 'styled-components';
import HomeImage from '../../assets/img/home.png';
import useLpStats from '../../hooks/useLpStats';
import { Box, Button, Grid, Paper, Typography } from '@material-ui/core';
import useEctoStats from '../../hooks/useEctoStats';
import TokenInput from '../../components/TokenInput';
import useEctoFinance from '../../hooks/useEctoFinance';
import { useWallet } from 'use-wallet';
import useTokenBalance from '../../hooks/useTokenBalance';
import { getDisplayBalance } from '../../utils/formatBalance';
import useApproveTaxOffice from '../../hooks/useApproveTaxOffice';
import { ApprovalState } from '../../hooks/useApprove';
import useProvideEctoFtmLP from '../../hooks/useProvideEctoFtmLP';
import { Alert } from '@material-ui/lab';

const BackgroundImage = createGlobalStyle`
  body {
    background: url(${HomeImage}) no-repeat !important;
    background-size: cover !important;
  }
`;
function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

const ProvideLiquidity = () => {
  const [ectoAmount, setEctoAmount] = useState(0);
  const [ftmAmount, setFtmAmount] = useState(0);
  const [lpTokensAmount, setLpTokensAmount] = useState(0);
  const { balance } = useWallet();
  const ectoStats = useEctoStats();
  const ectoFinance = useEctoFinance();
  const [approveTaxOfficeStatus, approveTaxOffice] = useApproveTaxOffice();
  const ectoBalance = useTokenBalance(ectoFinance.ECTO);
  const ftmBalance = (balance / 1e18).toFixed(4);
  const { onProvideEctoFtmLP } = useProvideEctoFtmLP();
  const ectoFtmLpStats = useLpStats('ECTO-FTM-LP');

  const ectoLPStats = useMemo(() => (ectoFtmLpStats ? ectoFtmLpStats : null), [ectoFtmLpStats]);
  const ectoPriceInFTM = useMemo(() => (ectoStats ? Number(ectoStats.tokenInFtm).toFixed(2) : null), [ectoStats]);
  const ftmPriceInTOMB = useMemo(() => (ectoStats ? Number(1 / ectoStats.tokenInFtm).toFixed(2) : null), [ectoStats]);
  // const classes = useStyles();

  const handleEctoChange = async (e) => {
    if (e.currentTarget.value === '' || e.currentTarget.value === 0) {
      setEctoAmount(e.currentTarget.value);
    }
    if (!isNumeric(e.currentTarget.value)) return;
    setEctoAmount(e.currentTarget.value);
    const quoteFromSpooky = await ectoFinance.quoteFromSpooky(e.currentTarget.value, 'ECTO');
    setFtmAmount(quoteFromSpooky);
    setLpTokensAmount(quoteFromSpooky / ectoLPStats.ftmAmount);
  };

  const handleFtmChange = async (e) => {
    if (e.currentTarget.value === '' || e.currentTarget.value === 0) {
      setFtmAmount(e.currentTarget.value);
    }
    if (!isNumeric(e.currentTarget.value)) return;
    setFtmAmount(e.currentTarget.value);
    const quoteFromSpooky = await ectoFinance.quoteFromSpooky(e.currentTarget.value, 'FTM');
    setEctoAmount(quoteFromSpooky);

    setLpTokensAmount(quoteFromSpooky / ectoLPStats.tokenAmount);
  };
  const handleEctoSelectMax = async () => {
    const quoteFromSpooky = await ectoFinance.quoteFromSpooky(getDisplayBalance(ectoBalance), 'ECTO');
    setEctoAmount(getDisplayBalance(ectoBalance));
    setFtmAmount(quoteFromSpooky);
    setLpTokensAmount(quoteFromSpooky / ectoLPStats.ftmAmount);
  };
  const handleFtmSelectMax = async () => {
    const quoteFromSpooky = await ectoFinance.quoteFromSpooky(ftmBalance, 'FTM');
    setFtmAmount(ftmBalance);
    setEctoAmount(quoteFromSpooky);
    setLpTokensAmount(ftmBalance / ectoLPStats.ftmAmount);
  };
  return (
    <Page>
      <BackgroundImage />
      <Typography color="textPrimary" align="center" variant="h3" gutterBottom>
        Provide Liquidity
      </Typography>

      <Grid container justify="center">
        <Box style={{ width: '600px' }}>
          <Alert variant="filled" severity="warning" style={{ marginBottom: '10px' }}>
            <b>
              This and{' '}
              <a href="https://spookyswap.finance/" rel="noopener noreferrer" target="_blank">
                Spookyswap
              </a>{' '}
              are the only ways to provide Liquidity on ECTO-FTM pair without paying tax.
            </b>
          </Alert>
          <Grid item xs={12} sm={12}>
            <Paper>
              <Box mt={4}>
                <Grid item xs={12} sm={12} style={{ borderRadius: 15 }}>
                  <Box p={4}>
                    <Grid container>
                      <Grid item xs={12}>
                        <TokenInput
                          onSelectMax={handleEctoSelectMax}
                          onChange={handleEctoChange}
                          value={ectoAmount}
                          max={getDisplayBalance(ectoBalance)}
                          symbol={'ECTO'}
                        ></TokenInput>
                      </Grid>
                      <Grid item xs={12}>
                        <TokenInput
                          onSelectMax={handleFtmSelectMax}
                          onChange={handleFtmChange}
                          value={ftmAmount}
                          max={ftmBalance}
                          symbol={'FTM'}
                        ></TokenInput>
                      </Grid>
                      <Grid item xs={12}>
                        <p>1 ECTO = {ectoPriceInFTM} FTM</p>
                        <p>1 FTM = {ftmPriceInTOMB} ECTO</p>
                        <p>LP tokens ≈ {lpTokensAmount.toFixed(2)}</p>
                      </Grid>
                      <Grid xs={12} justifyContent="center" style={{ textAlign: 'center' }}>
                        {approveTaxOfficeStatus === ApprovalState.APPROVED ? (
                          <Button
                            variant="contained"
                            onClick={() => onProvideEctoFtmLP(ftmAmount.toString(), ectoAmount.toString())}
                            color="primary"
                            style={{ margin: '0 10px', color: '#fff' }}
                          >
                            Supply
                          </Button>
                        ) : (
                          <Button
                            variant="contained"
                            onClick={() => approveTaxOffice()}
                            color="secondary"
                            style={{ margin: '0 10px' }}
                          >
                            Approve
                          </Button>
                        )}
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>
              </Box>
            </Paper>
          </Grid>
        </Box>
      </Grid>
    </Page>
  );
};

export default ProvideLiquidity;
