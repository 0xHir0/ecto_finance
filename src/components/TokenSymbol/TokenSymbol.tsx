import React from 'react';

//Graveyard ecosystem logos
import ectoLogo from '../../assets/img/crypto_ecto_cash.svg';
import eShareLogo from '../../assets/img/crypto_ecto_share.svg';
import ectoLogoPNG from '../../assets/img/crypto_ecto_cash.f2b44ef4.png';
import eShareLogoPNG from '../../assets/img/crypto_ecto_share.bf1a6c52.png';
import tBondLogo from '../../assets/img/crypto_ecto_bond.svg';

import ectoFtmLpLogo from '../../assets/img/ecto_ftm_lp.png';
import tshareFtmLpLogo from '../../assets/img/eshare_ftm_lp.png';

import wftmLogo from '../../assets/img/ftm_logo_blue.svg';
import booLogo from '../../assets/img/spooky.png';
import mimLogo from '../../assets/img/mim_logo.svg';
import wethLogo from '../../assets/img/weth_logo.svg';

const logosBySymbol: { [title: string]: string } = {
  //Real tokens
  //=====================
  ECTO: ectoLogo,
  ECTOPNG: ectoLogoPNG,
  ESHAREPNG: eShareLogoPNG,
  ESHARE: eShareLogo,
  EBOND: tBondLogo,
  WFTM: wftmLogo,
  BOO: booLogo,
  WETH: wethLogo,
  MIM: mimLogo,
  'ECTO-FTM-LP': ectoFtmLpLogo,
  'ESHARE-FTM-LP': tshareFtmLpLogo,
};

type LogoProps = {
  symbol: string;
  size?: number;
};

const TokenSymbol: React.FC<LogoProps> = ({ symbol, size = 64 }) => {
  if (!logosBySymbol[symbol]) {
    throw new Error(`Invalid Token Logo symbol: ${symbol}`);
  }
  return <img src={logosBySymbol[symbol]} alt={`${symbol} Logo`} width={size} height={size} />;
};

export default TokenSymbol;
