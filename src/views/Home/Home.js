import React, { useMemo } from 'react';
import Page from '../../components/Page';
import HomeImage from '../../assets/img/home.png';
import CashImage from '../../assets/img/crypto_ecto_cash.svg';
import Image from 'material-ui-image';
import styled from 'styled-components';
import { Alert } from '@material-ui/lab';
import { createGlobalStyle } from 'styled-components';
import CountUp from 'react-countup';
import CardIcon from '../../components/CardIcon';
import TokenSymbol from '../../components/TokenSymbol';
import useEctoStats from '../../hooks/useEctoStats';
import useLpStats from '../../hooks/useLpStats';
import useModal from '../../hooks/useModal';
import useZap from '../../hooks/useZap';
import useBondStats from '../../hooks/useBondStats';
import useEShareStats from '../../hooks/useEShareStats';
import useTotalValueLocked from '../../hooks/useTotalValueLocked';
import { ecto as ectoTesting, eShare as eShareTesting } from '../../ecto-finance/deployments/deployments.testing.json';
import { ecto as ectoProd, eShare as eShareProd } from '../../ecto-finance/deployments/deployments.mainnet.json';

import MetamaskFox from '../../assets/img/metamask-fox.svg';

import { Box, Button, Card, CardContent, Grid, Paper } from '@material-ui/core';
import ZapModal from '../Bank/components/ZapModal';

import { makeStyles } from '@material-ui/core/styles';
import useEctoFinance from '../../hooks/useEctoFinance';

const BackgroundImage = createGlobalStyle`
  body {
    background: url(${HomeImage}) no-repeat !important;
    background-size: cover !important;
  }
`;

const useStyles = makeStyles((theme) => ({
  button: {
    [theme.breakpoints.down('415')]: {
      marginTop: '10px',
    },
  },
}));

const Home = () => {
  const classes = useStyles();
  const TVL = useTotalValueLocked();
  const ectoFtmLpStats = useLpStats('ECTO-FTM-LP');
  const eShareFtmLpStats = useLpStats('ESHARE-FTM-LP');
  const ectoStats = useEctoStats();
  const eShareStats = useEShareStats();
  const tBondStats = useBondStats();
  const ectoFinance = useEctoFinance();

  let ecto;
  let eShare;
  if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
    ecto = ectoTesting;
    eShare = eShareTesting;
  } else {
    ecto = ectoProd;
    eShare = eShareProd;
  }

  const buyEctoAddress = 'https://spookyswap.finance/swap?outputCurrency=' + ecto.address;
  const buyEShareAddress = 'https://spookyswap.finance/swap?outputCurrency=' + eShare.address;

  const ectoLPStats = useMemo(() => (ectoFtmLpStats ? ectoFtmLpStats : null), [ectoFtmLpStats]);
  const tshareLPStats = useMemo(() => (eShareFtmLpStats ? eShareFtmLpStats : null), [eShareFtmLpStats]);
  const ectoPriceInDollars = useMemo(
    () => (ectoStats ? Number(ectoStats.priceInDollars).toFixed(2) : null),
    [ectoStats],
  );
  const ectoPriceInFTM = useMemo(() => (ectoStats ? Number(ectoStats.tokenInFtm).toFixed(4) : null), [ectoStats]);
  const ectoCirculatingSupply = useMemo(() => (ectoStats ? String(ectoStats.circulatingSupply) : null), [ectoStats]);
  const ectoTotalSupply = useMemo(() => (ectoStats ? String(ectoStats.totalSupply) : null), [ectoStats]);

  const eSharePriceInDollars = useMemo(
    () => (eShareStats ? Number(eShareStats.priceInDollars).toFixed(2) : null),
    [eShareStats],
  );
  const eSharePriceInFTM = useMemo(
    () => (eShareStats ? Number(eShareStats.tokenInFtm).toFixed(4) : null),
    [eShareStats],
  );
  const eShareCirculatingSupply = useMemo(
    () => (eShareStats ? String(eShareStats.circulatingSupply) : null),
    [eShareStats],
  );
  const eShareTotalSupply = useMemo(() => (eShareStats ? String(eShareStats.totalSupply) : null), [eShareStats]);

  const tBondPriceInDollars = useMemo(
    () => (tBondStats ? Number(tBondStats.priceInDollars).toFixed(2) : null),
    [tBondStats],
  );
  const tBondPriceInFTM = useMemo(() => (tBondStats ? Number(tBondStats.tokenInFtm).toFixed(4) : null), [tBondStats]);
  const tBondCirculatingSupply = useMemo(
    () => (tBondStats ? String(tBondStats.circulatingSupply) : null),
    [tBondStats],
  );
  const tBondTotalSupply = useMemo(() => (tBondStats ? String(tBondStats.totalSupply) : null), [tBondStats]);

  const ectoLpZap = useZap({ depositTokenName: 'ECTO-FTM-LP' });
  const tshareLpZap = useZap({ depositTokenName: 'ESHARE-FTM-LP' });

  const StyledLink = styled.a`
    font-weight: 700;
    text-decoration: none;
  `;

  const [onPresentEctoZap, onDissmissEctoZap] = useModal(
    <ZapModal
      decimals={18}
      onConfirm={(zappingToken, tokenName, amount) => {
        if (Number(amount) <= 0 || isNaN(Number(amount))) return;
        ectoLpZap.onZap(zappingToken, tokenName, amount);
        onDissmissEctoZap();
      }}
      tokenName={'ECTO-FTM-LP'}
    />,
  );

  const [onPresentTshareZap, onDissmissTshareZap] = useModal(
    <ZapModal
      decimals={18}
      onConfirm={(zappingToken, tokenName, amount) => {
        if (Number(amount) <= 0 || isNaN(Number(amount))) return;
        tshareLpZap.onZap(zappingToken, tokenName, amount);
        onDissmissTshareZap();
      }}
      tokenName={'ESHARE-FTM-LP'}
    />,
  );

  return (
    <Page>
      <BackgroundImage />
      <Grid container spacing={3}>
        {/* Logo */}
        <Grid container item xs={12} sm={4} justify="center">
          {/* <Paper>xs=6 sm=3</Paper> */}
          <Image color="none" style={{ width: '300px', paddingTop: '0px' }} src={CashImage} />
        </Grid>
        {/* Explanation text */}
        <Grid item xs={12} sm={8}>
          <Paper>
            <Box p={4}>
              <h2>Welcome to Ecto Finance</h2>
              <p>The first algorithmic stablecoin on Fantom Opera, pegged to the price of 1 FTM via seigniorage.</p>
              <p>
                Stake your ECTO-FTM LP in the Graveyard to earn ESHARE rewards. Then stake your earned ESHARE in the
                Masonry to earn more ECTO!
              </p>
            </Box>
          </Paper>
        </Grid>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={12} justify="center" style={{ margin: '12px', display: 'flex' }}>
            <Alert variant="filled" severity="warning">
              <b>
                Please visit our{' '}
                <StyledLink target="_blank" href="https://docs.ecto.finance">
                  documentation
                </StyledLink>{' '}
                before purchasing ECTO or ESHARE!
              </b>
            </Alert>
          </Grid>
        </Grid>

        {/* TVL */}
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent align="center">
              <h2>Total Value Locked</h2>
              <CountUp style={{ fontSize: '25px' }} end={TVL} separator="," prefix="$" />
            </CardContent>
          </Card>
        </Grid>

        {/* Wallet */}
        <Grid item xs={12} sm={8}>
          <Card style={{ height: '100%' }}>
            <CardContent align="center" style={{ marginTop: '2.5%' }}>
              {/* <h2 style={{ marginBottom: '20px' }}>Wallet Balance</h2> */}
              <Button color="primary" href="/reliquary" variant="contained" style={{ marginRight: '10px' }}>
                Stake Now
              </Button>
              <Button href="/graveyard" variant="contained" style={{ marginRight: '10px' }}>
                Farm Now
              </Button>
              <Button
                color="primary"
                target="_blank"
                href={buyEctoAddress}
                variant="contained"
                style={{ marginRight: '10px' }}
                className={classes.button}
              >
                Buy ECTO
              </Button>
              <Button variant="contained" target="_blank" href={buyEShareAddress} className={classes.button}>
                Buy ESHARE
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* ECTO */}
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent align="center" style={{ position: 'relative' }}>
              <h2>ECTO</h2>
              <Button
                onClick={() => {
                  ectoFinance.watchAssetInMetamask('ECTO');
                }}
                color="primary"
                variant="outlined"
                style={{ position: 'absolute', top: '10px', right: '10px' }}
              >
                +&nbsp;
                <img alt="metamask fox" style={{ width: '20px' }} src={MetamaskFox} />
              </Button>
              <Box mt={2}>
                <CardIcon>
                  <TokenSymbol symbol="ECTO" />
                </CardIcon>
              </Box>
              Current Price
              <Box>
                <span style={{ fontSize: '30px' }}>{ectoPriceInFTM ? ectoPriceInFTM : '-.----'} FTM</span>
              </Box>
              <Box>
                <span style={{ fontSize: '16px', alignContent: 'flex-start' }}>
                  ${ectoPriceInDollars ? ectoPriceInDollars : '-.--'}
                </span>
              </Box>
              <span style={{ fontSize: '12px' }}>
                Market Cap: ${(ectoCirculatingSupply * ectoPriceInDollars).toFixed(2)} <br />
                Circulating Supply: {ectoCirculatingSupply} <br />
                Total Supply: {ectoTotalSupply}
              </span>
            </CardContent>
          </Card>
        </Grid>

        {/* ESHARE */}
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent align="center" style={{ position: 'relative' }}>
              <h2>ESHARE</h2>
              <Button
                onClick={() => {
                  ectoFinance.watchAssetInMetamask('ESHARE');
                }}
                color="primary"
                variant="outlined"
                style={{ position: 'absolute', top: '10px', right: '10px' }}
              >
                +&nbsp;
                <img alt="metamask fox" style={{ width: '20px' }} src={MetamaskFox} />
              </Button>
              <Box mt={2}>
                <CardIcon>
                  <TokenSymbol symbol="ESHARE" />
                </CardIcon>
              </Box>
              Current Price
              <Box>
                <span style={{ fontSize: '30px' }}>{eSharePriceInFTM ? eSharePriceInFTM : '-.----'} FTM</span>
              </Box>
              <Box>
                <span style={{ fontSize: '16px' }}>${eSharePriceInDollars ? eSharePriceInDollars : '-.--'}</span>
              </Box>
              <span style={{ fontSize: '12px' }}>
                Market Cap: ${(eShareCirculatingSupply * eSharePriceInDollars).toFixed(2)} <br />
                Circulating Supply: {eShareCirculatingSupply} <br />
                Total Supply: {eShareTotalSupply}
              </span>
            </CardContent>
          </Card>
        </Grid>

        {/* EBOND */}
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent align="center" style={{ position: 'relative' }}>
              <h2>EBOND</h2>
              <Button
                onClick={() => {
                  ectoFinance.watchAssetInMetamask('EBOND');
                }}
                color="primary"
                variant="outlined"
                style={{ position: 'absolute', top: '10px', right: '10px' }}
              >
                +&nbsp;
                <img alt="metamask fox" style={{ width: '20px' }} src={MetamaskFox} />
              </Button>
              <Box mt={2}>
                <CardIcon>
                  <TokenSymbol symbol="EBOND" />
                </CardIcon>
              </Box>
              Current Price
              <Box>
                <span style={{ fontSize: '30px' }}>{tBondPriceInFTM ? tBondPriceInFTM : '-.----'} FTM</span>
              </Box>
              <Box>
                <span style={{ fontSize: '16px' }}>${tBondPriceInDollars ? tBondPriceInDollars : '-.--'}</span>
              </Box>
              <span style={{ fontSize: '12px' }}>
                Market Cap: ${(tBondCirculatingSupply * tBondPriceInDollars).toFixed(2)} <br />
                Circulating Supply: {tBondCirculatingSupply} <br />
                Total Supply: {tBondTotalSupply}
              </span>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Card>
            <CardContent align="center">
              <h2>ECTO-FTM Spooky LP</h2>
              <Box mt={2}>
                <CardIcon>
                  <TokenSymbol symbol="ECTO-FTM-LP" />
                </CardIcon>
              </Box>
              <Box mt={2}>
                <Button color="primary" disabled={true} onClick={onPresentEctoZap} variant="contained">
                  Zap In
                </Button>
              </Box>
              <Box mt={2}>
                <span style={{ fontSize: '26px' }}>
                  {ectoLPStats?.tokenAmount ? ectoLPStats?.tokenAmount : '-.--'} ECTO /{' '}
                  {ectoLPStats?.ftmAmount ? ectoLPStats?.ftmAmount : '-.--'} FTM
                </span>
              </Box>
              <Box>${ectoLPStats?.priceOfOne ? ectoLPStats.priceOfOne : '-.--'}</Box>
              <span style={{ fontSize: '12px' }}>
                Liquidity: ${ectoLPStats?.totalLiquidity ? ectoLPStats.totalLiquidity : '-.--'} <br />
                Total supply: {ectoLPStats?.totalSupply ? ectoLPStats.totalSupply : '-.--'}
              </span>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Card>
            <CardContent align="center">
              <h2>ESHARE-FTM Spooky LP</h2>
              <Box mt={2}>
                <CardIcon>
                  <TokenSymbol symbol="ESHARE-FTM-LP" />
                </CardIcon>
              </Box>
              <Box mt={2}>
                <Button color="primary" onClick={onPresentTshareZap} variant="contained">
                  Zap In
                </Button>
              </Box>
              <Box mt={2}>
                <span style={{ fontSize: '26px' }}>
                  {tshareLPStats?.tokenAmount ? tshareLPStats?.tokenAmount : '-.--'} ESHARE /{' '}
                  {tshareLPStats?.ftmAmount ? tshareLPStats?.ftmAmount : '-.--'} FTM
                </span>
              </Box>
              <Box>${tshareLPStats?.priceOfOne ? tshareLPStats.priceOfOne : '-.--'}</Box>
              <span style={{ fontSize: '12px' }}>
                Liquidity: ${tshareLPStats?.totalLiquidity ? tshareLPStats.totalLiquidity : '-.--'}
                <br />
                Total supply: {tshareLPStats?.totalSupply ? tshareLPStats.totalSupply : '-.--'}
              </span>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Page>
  );
};

export default Home;
