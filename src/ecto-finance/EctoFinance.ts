// import { Fetcher, Route, Token } from '@uniswap/sdk';
import { Fetcher as FetcherSpirit, Token as TokenSpirit } from '@spiritswap/sdk';
import { Fetcher, Route, Token } from '@spookyswap/sdk';
import { Configuration } from './config';
import { ContractName, TokenStat, AllocationTime, LPStat, Bank, PoolStats, EShareSwapperStat } from './types';
import { BigNumber, Contract, ethers, EventFilter } from 'ethers';
import { decimalToBalance } from './ether-utils';
import { TransactionResponse } from '@ethersproject/providers';
import ERC20 from './ERC20';
import { getFullDisplayBalance, getDisplayBalance } from '../utils/formatBalance';
import { getDefaultProvider } from '../utils/provider';
import IUniswapV2PairABI from './IUniswapV2Pair.abi.json';
import config, { bankDefinitions } from '../config';
import moment from 'moment';
import { parseUnits } from 'ethers/lib/utils';
import { FTM_TICKER, SPOOKY_ROUTER_ADDR, ECTO_TICKER } from '../utils/constants';
/**
 * An API module of Ecto Finance contracts.
 * All contract-interacting domain logic should be defined in here.
 */
export class EctoFinance {
  myAccount: string;
  provider: ethers.providers.Web3Provider;
  signer?: ethers.Signer;
  config: Configuration;
  contracts: { [name: string]: Contract };
  externalTokens: { [name: string]: ERC20 };
  masonryVersionOfUser?: string;

  ECTOWFTM_LP: Contract;
  ECTO: ERC20;
  ESHARE: ERC20;
  EBOND: ERC20;
  FTM: ERC20;

  constructor(cfg: Configuration) {
    const { deployments, externalTokens } = cfg;
    const provider = getDefaultProvider();

    // loads contracts from deployments
    this.contracts = {};
    for (const [name, deployment] of Object.entries(deployments)) {
      this.contracts[name] = new Contract(deployment.address, deployment.abi, provider);
    }
    this.externalTokens = {};
    for (const [symbol, [address, decimal]] of Object.entries(externalTokens)) {
      this.externalTokens[symbol] = new ERC20(address, provider, symbol, decimal);
    }
    this.ECTO = new ERC20(deployments.ecto.address, provider, 'ECTO');
    this.ESHARE = new ERC20(deployments.eShare.address, provider, 'ESHARE');
    this.EBOND = new ERC20(deployments.eBond.address, provider, 'EBOND');
    this.FTM = this.externalTokens['WFTM'];

    // Uniswap V2 Pair
    this.ECTOWFTM_LP = new Contract(externalTokens['ECTO-FTM-LP'][0], IUniswapV2PairABI, provider);

    this.config = cfg;
    this.provider = provider;
  }

  /**
   * @param provider From an unlocked wallet. (e.g. Metamask)
   * @param account An address of unlocked wallet account.
   */
  unlockWallet(provider: any, account: string) {
    const newProvider = new ethers.providers.Web3Provider(provider, this.config.chainId);
    this.signer = newProvider.getSigner(0);
    this.myAccount = account;
    for (const [name, contract] of Object.entries(this.contracts)) {
      this.contracts[name] = contract.connect(this.signer);
    }
    const tokens = [this.ECTO, this.ESHARE, this.EBOND, ...Object.values(this.externalTokens)];
    for (const token of tokens) {
      token.connect(this.signer);
    }
    this.ECTOWFTM_LP = this.ECTOWFTM_LP.connect(this.signer);
    console.log(`🔓 Wallet is unlocked. Welcome, ${account}!`);
    this.fetchMasonryVersionOfUser()
      .then((version) => (this.masonryVersionOfUser = version))
      .catch((err) => {
        console.error(`Failed to fetch masonry version: ${err.stack}`);
        this.masonryVersionOfUser = 'latest';
      });
  }

  get isUnlocked(): boolean {
    return !!this.myAccount;
  }

  //===================================================================
  //===================== GET ASSET STATS =============================
  //===================FROM SPOOKY TO DISPLAY =========================
  //=========================IN HOME PAGE==============================
  //===================================================================

  async getEctoStat(): Promise<TokenStat> {
    const { EctoFtmRewardPool, EctoFtmLpEctoRewardPool, EctoFtmLpEctoRewardPoolOld } = this.contracts;
    const supply = await this.ECTO.totalSupply();
    const ectoRewardPoolSupply = await this.ECTO.balanceOf(EctoFtmRewardPool.address);
    const ectoRewardPoolSupply2 = await this.ECTO.balanceOf(EctoFtmLpEctoRewardPool.address);
    const ectoRewardPoolSupplyOld = await this.ECTO.balanceOf(EctoFtmLpEctoRewardPoolOld.address);
    const ectoCirculatingSupply = supply
      .sub(ectoRewardPoolSupply)
      .sub(ectoRewardPoolSupply2)
      .sub(ectoRewardPoolSupplyOld);
    const priceInFTM = await this.getTokenPriceFromPancakeswap(this.ECTO);
    const priceOfOneFTM = await this.getWFTMPriceFromPancakeswap();
    const priceOfEctoInDollars = (Number(priceInFTM) * Number(priceOfOneFTM)).toFixed(2);

    return {
      tokenInFtm: priceInFTM,
      priceInDollars: priceOfEctoInDollars,
      totalSupply: getDisplayBalance(supply, this.ECTO.decimal, 0),
      circulatingSupply: getDisplayBalance(ectoCirculatingSupply, this.ECTO.decimal, 0),
    };
  }

  /**
   * Calculates various stats for the requested LP
   * @param name of the LP token to load stats for
   * @returns
   */
  async getLPStat(name: string): Promise<LPStat> {
    const lpToken = this.externalTokens[name];
    const lpTokenSupplyBN = await lpToken.totalSupply();
    const lpTokenSupply = getDisplayBalance(lpTokenSupplyBN, 18);
    const token0 = name.startsWith('ECTO') ? this.ECTO : this.ESHARE;
    const isEcto = name.startsWith('ECTO');
    const tokenAmountBN = await token0.balanceOf(lpToken.address);
    const tokenAmount = getDisplayBalance(tokenAmountBN, 18);

    const ftmAmountBN = await this.FTM.balanceOf(lpToken.address);
    const ftmAmount = getDisplayBalance(ftmAmountBN, 18);
    const tokenAmountInOneLP = Number(tokenAmount) / Number(lpTokenSupply);
    const ftmAmountInOneLP = Number(ftmAmount) / Number(lpTokenSupply);
    const lpTokenPrice = await this.getLPTokenPrice(lpToken, token0, isEcto);
    const lpTokenPriceFixed = Number(lpTokenPrice).toFixed(2).toString();
    const liquidity = (Number(lpTokenSupply) * Number(lpTokenPrice)).toFixed(2).toString();
    return {
      tokenAmount: tokenAmountInOneLP.toFixed(2).toString(),
      ftmAmount: ftmAmountInOneLP.toFixed(2).toString(),
      priceOfOne: lpTokenPriceFixed,
      totalLiquidity: liquidity,
      totalSupply: Number(lpTokenSupply).toFixed(2).toString(),
    };
  }

  /**
   * Use this method to get price for Ecto
   * @returns TokenStat for EBOND
   * priceInFTM
   * priceInDollars
   * TotalSupply
   * CirculatingSupply (always equal to total supply for bonds)
   */
  async getBondStat(): Promise<TokenStat> {
    const { Treasury } = this.contracts;
    const ectoStat = await this.getEctoStat();
    const bondEctoRatioBN = await Treasury.getBondPremiumRate();
    const modifier = bondEctoRatioBN / 1e18 > 1 ? bondEctoRatioBN / 1e18 : 1;
    const bondPriceInFTM = (Number(ectoStat.tokenInFtm) * modifier).toFixed(2);
    const priceOfEBondInDollars = (Number(ectoStat.priceInDollars) * modifier).toFixed(2);
    const supply = await this.EBOND.displayedTotalSupply();
    return {
      tokenInFtm: bondPriceInFTM,
      priceInDollars: priceOfEBondInDollars,
      totalSupply: supply,
      circulatingSupply: supply,
    };
  }

  /**
   * @returns TokenStat for ESHARE
   * priceInFTM
   * priceInDollars
   * TotalSupply
   * CirculatingSupply (always equal to total supply for bonds)
   */
  async geeShareStat(): Promise<TokenStat> {
    const { EctoFtmLPEShareRewardPool } = this.contracts;

    const supply = await this.ESHARE.totalSupply();

    const priceInFTM = await this.getTokenPriceFromPancakeswap(this.ESHARE);
    const ectoRewardPoolSupply = await this.ESHARE.balanceOf(EctoFtmLPEShareRewardPool.address);
    const eShareCirculatingSupply = supply.sub(ectoRewardPoolSupply);
    const priceOfOneFTM = await this.getWFTMPriceFromPancakeswap();
    const priceOfSharesInDollars = (Number(priceInFTM) * Number(priceOfOneFTM)).toFixed(2);

    return {
      tokenInFtm: priceInFTM,
      priceInDollars: priceOfSharesInDollars,
      totalSupply: getDisplayBalance(supply, this.ESHARE.decimal, 0),
      circulatingSupply: getDisplayBalance(eShareCirculatingSupply, this.ESHARE.decimal, 0),
    };
  }

  async getEctoStatInEstimatedTWAP(): Promise<TokenStat> {
    const { SeigniorageOracle, EctoFtmRewardPool } = this.contracts;
    const expectedPrice = await SeigniorageOracle.twap(this.ECTO.address, ethers.utils.parseEther('1'));

    const supply = await this.ECTO.totalSupply();
    const ectoRewardPoolSupply = await this.ECTO.balanceOf(EctoFtmRewardPool.address);
    const ectoCirculatingSupply = supply.sub(ectoRewardPoolSupply);
    return {
      tokenInFtm: getDisplayBalance(expectedPrice),
      priceInDollars: getDisplayBalance(expectedPrice),
      totalSupply: getDisplayBalance(supply, this.ECTO.decimal, 0),
      circulatingSupply: getDisplayBalance(ectoCirculatingSupply, this.ECTO.decimal, 0),
    };
  }

  async Ecto(): Promise<BigNumber> {
    const { Treasury } = this.contracts;
    return Treasury.getEctoUpdatedPrice();
  }

  async getBondsPurchasable(): Promise<BigNumber> {
    const { Treasury } = this.contracts;
    return Treasury.getBurnableEctoLeft();
  }

  /**
   * Calculates the TVL, APR and daily APR of a provided pool/bank
   * @param bank
   * @returns
   */
  async getPoolAPRs(bank: Bank): Promise<PoolStats> {
    if (this.myAccount === undefined) return;
    const depositToken = bank.depositToken;
    const poolContract = this.contracts[bank.contract];
    const depositTokenPrice = await this.getDepositTokenPriceInDollars(bank.depositTokenName, depositToken);
    const stakeInPool = await depositToken.balanceOf(bank.address);
    const TVL = Number(depositTokenPrice) * Number(getDisplayBalance(stakeInPool, depositToken.decimal));
    const stat = bank.earnTokenName === 'ECTO' ? await this.getEctoStat() : await this.geeShareStat();
    const tokenPerSecond = await this.getTokenPerSecond(
      bank.earnTokenName,
      bank.contract,
      poolContract,
      bank.depositTokenName,
    );

    const tokenPerHour = tokenPerSecond.mul(60).mul(60);
    const totalRewardPricePerYear =
      Number(stat.priceInDollars) * Number(getDisplayBalance(tokenPerHour.mul(24).mul(365)));
    const totalRewardPricePerDay = Number(stat.priceInDollars) * Number(getDisplayBalance(tokenPerHour.mul(24)));
    const totalStakingTokenInPool =
      Number(depositTokenPrice) * Number(getDisplayBalance(stakeInPool, depositToken.decimal));
    const dailyAPR = (totalRewardPricePerDay / totalStakingTokenInPool) * 100;
    const yearlyAPR = (totalRewardPricePerYear / totalStakingTokenInPool) * 100;
    return {
      dailyAPR: dailyAPR.toFixed(2).toString(),
      yearlyAPR: yearlyAPR.toFixed(2).toString(),
      TVL: TVL.toFixed(2).toString(),
    };
  }

  /**
   * Method to return the amount of tokens the pool yields per second
   * @param earnTokenName the name of the token that the pool is earning
   * @param contractName the contract of the pool/bank
   * @param poolContract the actual contract of the pool
   * @returns
   */
  async getTokenPerSecond(
    earnTokenName: string,
    contractName: string,
    poolContract: Contract,
    depositTokenName: string,
  ) {
    if (earnTokenName === 'ECTO') {
      if (!contractName.endsWith('EctoRewardPool')) {
        const rewardPerSecond = await poolContract.ectoPerSecond();
        if (depositTokenName === 'WFTM') {
          return rewardPerSecond.mul(6000).div(11000).div(24);
        } else if (depositTokenName === 'BOO') {
          return rewardPerSecond.mul(2500).div(11000).div(24);
        } else if (depositTokenName === 'MIM') {
          return rewardPerSecond.mul(1000).div(11000).div(24);
        } else if (depositTokenName === 'WETH') {
          return rewardPerSecond.mul(1500).div(11000).div(24);
        }
        return rewardPerSecond.div(24);
      }
      const poolStartTime = await poolContract.poolStartTime();
      const startDateTime = new Date(poolStartTime.toNumber() * 1000);
      const FOUR_DAYS = 4 * 24 * 60 * 60 * 1000;
      if (Date.now() - startDateTime.getTime() > FOUR_DAYS) {
        return await poolContract.epochEctoPerSecond(1);
      }
      return await poolContract.epochEctoPerSecond(0);
    }
    const rewardPerSecond = await poolContract.eSharePerSecond();
    if (depositTokenName.startsWith('ECTO')) {
      return rewardPerSecond.mul(35500).div(59500);
    } else {
      return rewardPerSecond.mul(24000).div(59500);
    }
  }

  /**
   * Method to calculate the tokenPrice of the deposited asset in a pool/bank
   * If the deposited token is an LP it will find the price of its pieces
   * @param tokenName
   * @param pool
   * @param token
   * @returns
   */
  async getDepositTokenPriceInDollars(tokenName: string, token: ERC20) {
    let tokenPrice;
    const priceOfOneFtmInDollars = await this.getWFTMPriceFromPancakeswap();
    if (tokenName === 'WFTM') {
      tokenPrice = priceOfOneFtmInDollars;
    } else {
      if (tokenName === 'ECTO-FTM-LP') {
        tokenPrice = await this.getLPTokenPrice(token, this.ECTO, true);
      } else if (tokenName === 'ESHARE-FTM-LP') {
        tokenPrice = await this.getLPTokenPrice(token, this.ESHARE, false);
      } else if (tokenName === 'WETH') {
        tokenPrice = await this.getTokenPriceFromSpiritswap(token);
      } else {
        tokenPrice = await this.getTokenPriceFromPancakeswap(token);
        tokenPrice = (Number(tokenPrice) * Number(priceOfOneFtmInDollars)).toString();
      }
    }
    return tokenPrice;
  }

  //===================================================================
  //===================== GET ASSET STATS =============================
  //=========================== END ===================================
  //===================================================================

  async getCurrentEpoch(): Promise<BigNumber> {
    const { Treasury } = this.contracts;
    return Treasury.epoch();
  }

  async getBondOraclePriceInLastTWAP(): Promise<BigNumber> {
    const { Treasury } = this.contracts;
    return Treasury.getBondPremiumRate();
  }

  /**
   * Buy bonds with cash.
   * @param amount amount of cash to purchase bonds with.
   */
  async buyBonds(amount: string | number): Promise<TransactionResponse> {
    const { Treasury } = this.contracts;
    const treasuryEctoPrice = await Treasury.getEctoPrice();
    return await Treasury.buyBonds(decimalToBalance(amount), treasuryEctoPrice);
  }

  /**
   * Redeem bonds for cash.
   * @param amount amount of bonds to redeem.
   */
  async redeemBonds(amount: string): Promise<TransactionResponse> {
    const { Treasury } = this.contracts;
    const priceForEcto = await Treasury.getEctoPrice();
    return await Treasury.redeemBonds(decimalToBalance(amount), priceForEcto);
  }

  async getTotalValueLocked(): Promise<Number> {
    let totalValue = 0;
    for (const bankInfo of Object.values(bankDefinitions)) {
      const pool = this.contracts[bankInfo.contract];
      const token = this.externalTokens[bankInfo.depositTokenName];
      const tokenPrice = await this.getDepositTokenPriceInDollars(bankInfo.depositTokenName, token);
      const tokenAmountInPool = await token.balanceOf(pool.address);
      const value = Number(getDisplayBalance(tokenAmountInPool, token.decimal)) * Number(tokenPrice);
      const poolValue = Number.isNaN(value) ? 0 : value;
      totalValue += poolValue;
    }

    const ESHAREPrice = (await this.geeShareStat()).priceInDollars;
    const masonryeShareBalanceOf = await this.ESHARE.balanceOf(this.currentMasonry().address);
    const masonryTVL = Number(getDisplayBalance(masonryeShareBalanceOf, this.ESHARE.decimal)) * Number(ESHAREPrice);

    return totalValue + masonryTVL;
  }

  /**
   * Calculates the price of an LP token
   * Reference https://github.com/DefiDebauchery/discordpricebot/blob/4da3cdb57016df108ad2d0bb0c91cd8dd5f9d834/pricebot/pricebot.py#L150
   * @param lpToken the token under calculation
   * @param token the token pair used as reference (the other one would be FTM in most cases)
   * @param isEcto sanity check for usage of ecto token or eShare
   * @returns price of the LP token
   */
  async getLPTokenPrice(lpToken: ERC20, token: ERC20, isEcto: boolean): Promise<string> {
    const totalSupply = getFullDisplayBalance(await lpToken.totalSupply(), lpToken.decimal);
    //Get amount of tokenA
    const tokenSupply = getFullDisplayBalance(await token.balanceOf(lpToken.address), token.decimal);
    const stat = isEcto === true ? await this.getEctoStat() : await this.geeShareStat();
    const priceOfToken = stat.priceInDollars;
    const tokenInLP = Number(tokenSupply) / Number(totalSupply);
    const tokenPrice = (Number(priceOfToken) * tokenInLP * 2) //We multiply by 2 since half the price of the lp token is the price of each piece of the pair. So twice gives the total
      .toString();
    return tokenPrice;
  }

  async earnedFromBank(
    poolName: ContractName,
    earnTokenName: String,
    poolId: Number,
    account = this.myAccount,
  ): Promise<BigNumber> {
    const pool = this.contracts[poolName];
    try {
      if (earnTokenName === 'ECTO') {
        return await pool.pendingTOMB(poolId, account);
      } else {
        return await pool.pendingShare(poolId, account);
      }
    } catch (err) {
      console.error(`Failed to call earned() on pool ${pool.address}: ${err.stack}`);
      return BigNumber.from(0);
    }
  }

  async stakedBalanceOnBank(poolName: ContractName, poolId: Number, account = this.myAccount): Promise<BigNumber> {
    const pool = this.contracts[poolName];
    try {
      let userInfo = await pool.userInfo(poolId, account);
      return await userInfo.amount;
    } catch (err) {
      console.error(`Failed to call balanceOf() on pool ${pool.address}: ${err.stack}`);
      return BigNumber.from(0);
    }
  }

  /**
   * Deposits token to given pool.
   * @param poolName A name of pool contract.
   * @param amount Number of tokens with decimals applied. (e.g. 1.45 DAI * 10^18)
   * @returns {string} Transaction hash
   */
  async stake(poolName: ContractName, poolId: Number, amount: BigNumber): Promise<TransactionResponse> {
    const pool = this.contracts[poolName];
    return await pool.deposit(poolId, amount);
  }

  /**
   * Withdraws token from given pool.
   * @param poolName A name of pool contract.
   * @param amount Number of tokens with decimals applied. (e.g. 1.45 DAI * 10^18)
   * @returns {string} Transaction hash
   */
  async unstake(poolName: ContractName, poolId: Number, amount: BigNumber): Promise<TransactionResponse> {
    const pool = this.contracts[poolName];
    return await pool.withdraw(poolId, amount);
  }

  /**
   * Transfers earned token reward from given pool to my account.
   */
  async harvest(poolName: ContractName, poolId: Number): Promise<TransactionResponse> {
    const pool = this.contracts[poolName];
    //By passing 0 as the amount, we are asking the contract to only redeem the reward and not the currently staked token
    return await pool.withdraw(poolId, 0);
  }

  /**
   * Harvests and withdraws deposited tokens from the pool.
   */
  async exit(poolName: ContractName, poolId: Number, account = this.myAccount): Promise<TransactionResponse> {
    const pool = this.contracts[poolName];
    let userInfo = await pool.userInfo(poolId, account);
    return await pool.withdraw(poolId, userInfo.amount);
  }

  async fetchMasonryVersionOfUser(): Promise<string> {
    return 'latest';
  }

  currentMasonry(): Contract {
    if (!this.masonryVersionOfUser) {
      //throw new Error('you must unlock the wallet to continue.');
    }
    return this.contracts.Masonry;
  }

  isOldMasonryMember(): boolean {
    return this.masonryVersionOfUser !== 'latest';
  }

  async getTokenPriceFromPancakeswap(tokenContract: ERC20): Promise<string> {
    const ready = await this.provider.ready;
    if (!ready) return;
    const { chainId } = this.config;
    const { WFTM } = this.config.externalTokens;

    const wftm = new Token(chainId, WFTM[0], WFTM[1]);
    const token = new Token(chainId, tokenContract.address, tokenContract.decimal, tokenContract.symbol);
    try {
      const wftmToToken = await Fetcher.fetchPairData(wftm, token, this.provider);
      const priceInBUSD = new Route([wftmToToken], token);

      return priceInBUSD.midPrice.toFixed(4);
    } catch (err) {
      console.error(`Failed to fetch token price of ${tokenContract.symbol}: ${err}`);
    }
  }

  async getTokenPriceFromSpiritswap(tokenContract: ERC20): Promise<string> {
    const ready = await this.provider.ready;
    if (!ready) return;
    const { chainId } = this.config;

    const { WFTM } = this.externalTokens;

    const wftm = new TokenSpirit(chainId, WFTM.address, WFTM.decimal);
    const token = new TokenSpirit(chainId, tokenContract.address, tokenContract.decimal, tokenContract.symbol);
    try {
      const wftmToToken = await FetcherSpirit.fetchPairData(wftm, token, this.provider);
      const liquidityToken = wftmToToken.liquidityToken;
      let ftmBalanceInLP = await WFTM.balanceOf(liquidityToken.address);
      let ftmAmount = Number(getFullDisplayBalance(ftmBalanceInLP, WFTM.decimal));
      let shibaBalanceInLP = await tokenContract.balanceOf(liquidityToken.address);
      let shibaAmount = Number(getFullDisplayBalance(shibaBalanceInLP, tokenContract.decimal));
      const priceOfOneFtmInDollars = await this.getWFTMPriceFromPancakeswap();
      let priceOfShiba = (ftmAmount / shibaAmount) * Number(priceOfOneFtmInDollars);
      return priceOfShiba.toString();
    } catch (err) {
      console.error(`Failed to fetch token price of ${tokenContract.symbol}: ${err}`);
    }
  }

  async getWFTMPriceFromPancakeswap(): Promise<string> {
    const ready = await this.provider.ready;
    if (!ready) return;
    const { WFTM, FUSDT } = this.externalTokens;
    try {
      const fusdt_wftm_lp_pair = this.externalTokens['USDT-FTM-LP'];
      let ftm_amount_BN = await WFTM.balanceOf(fusdt_wftm_lp_pair.address);
      let ftm_amount = Number(getFullDisplayBalance(ftm_amount_BN, WFTM.decimal));
      let fusdt_amount_BN = await FUSDT.balanceOf(fusdt_wftm_lp_pair.address);
      let fusdt_amount = Number(getFullDisplayBalance(fusdt_amount_BN, FUSDT.decimal));
      return (fusdt_amount / ftm_amount).toString();
    } catch (err) {
      console.error(`Failed to fetch token price of WFTM: ${err}`);
    }
  }

  //===================================================================
  //===================================================================
  //===================== MASONRY METHODS =============================
  //===================================================================
  //===================================================================

  async getMasonryAPR() {
    const Masonry = this.currentMasonry();
    const latestSnapshotIndex = await Masonry.latestSnapshotIndex();
    const lastHistory = await Masonry.masonryHistory(latestSnapshotIndex);

    const lastRewardsReceived = lastHistory[1];

    const ESHAREPrice = (await this.geeShareStat()).priceInDollars;
    const TOMBPrice = (await this.getEctoStat()).priceInDollars;
    const epochRewardsPerShare = lastRewardsReceived / 1e18;

    //Mgod formula
    const amountOfRewardsPerDay = epochRewardsPerShare * Number(TOMBPrice) * 4;
    const masonryeShareBalanceOf = await this.ESHARE.balanceOf(Masonry.address);
    const masonryTVL = Number(getDisplayBalance(masonryeShareBalanceOf, this.ESHARE.decimal)) * Number(ESHAREPrice);
    const realAPR = ((amountOfRewardsPerDay * 100) / masonryTVL) * 365;
    return realAPR;
  }

  /**
   * Checks if the user is allowed to retrieve their reward from the Masonry
   * @returns true if user can withdraw reward, false if they can't
   */
  async canUserClaimRewardFromMasonry(): Promise<boolean> {
    const Masonry = this.currentMasonry();
    return await Masonry.canClaimReward(this.myAccount);
  }

  /**
   * Checks if the user is allowed to retrieve their reward from the Masonry
   * @returns true if user can withdraw reward, false if they can't
   */
  async canUserUnstakeFromMasonry(): Promise<boolean> {
    const Masonry = this.currentMasonry();
    const canWithdraw = await Masonry.canWithdraw(this.myAccount);
    const stakedAmount = await this.getStakedSharesOnMasonry();
    const notStaked = Number(getDisplayBalance(stakedAmount, this.ESHARE.decimal)) === 0;
    const result = notStaked ? true : canWithdraw;
    return result;
  }

  async timeUntilClaimRewardFromMasonry(): Promise<BigNumber> {
    // const Masonry = this.currentMasonry();
    // const mason = await Masonry.masons(this.myAccount);
    return BigNumber.from(0);
  }

  async getTotalStakedInMasonry(): Promise<BigNumber> {
    const Masonry = this.currentMasonry();
    return await Masonry.totalSupply();
  }

  async stakeShareToMasonry(amount: string): Promise<TransactionResponse> {
    if (this.isOldMasonryMember()) {
      throw new Error("you're using old masonry. please withdraw and deposit the ESHARE again.");
    }
    const Masonry = this.currentMasonry();
    return await Masonry.stake(decimalToBalance(amount));
  }

  async getStakedSharesOnMasonry(): Promise<BigNumber> {
    const Masonry = this.currentMasonry();
    if (this.masonryVersionOfUser === 'v1') {
      return await Masonry.geeShareOf(this.myAccount);
    }
    return await Masonry.balanceOf(this.myAccount);
  }

  async getEarningsOnMasonry(): Promise<BigNumber> {
    const Masonry = this.currentMasonry();
    if (this.masonryVersionOfUser === 'v1') {
      return await Masonry.getCashEarningsOf(this.myAccount);
    }
    return await Masonry.earned(this.myAccount);
  }

  async withdrawShareFromMasonry(amount: string): Promise<TransactionResponse> {
    const Masonry = this.currentMasonry();
    return await Masonry.withdraw(decimalToBalance(amount));
  }

  async harvestCashFromMasonry(): Promise<TransactionResponse> {
    const Masonry = this.currentMasonry();
    if (this.masonryVersionOfUser === 'v1') {
      return await Masonry.claimDividends();
    }
    return await Masonry.claimReward();
  }

  async exitFromMasonry(): Promise<TransactionResponse> {
    const Masonry = this.currentMasonry();
    return await Masonry.exit();
  }

  async getTreasuryNextAllocationTime(): Promise<AllocationTime> {
    const { Treasury } = this.contracts;
    const nextEpochTimestamp: BigNumber = await Treasury.nextEpochPoint();
    const nextAllocation = new Date(nextEpochTimestamp.mul(1000).toNumber());
    const prevAllocation = new Date(Date.now());

    return { from: prevAllocation, to: nextAllocation };
  }
  /**
   * This method calculates and returns in a from to to format
   * the period the user needs to wait before being allowed to claim
   * their reward from the masonry
   * @returns Promise<AllocationTime>
   */
  async getUserClaimRewardTime(): Promise<AllocationTime> {
    const { Masonry, Treasury } = this.contracts;
    const nextEpochTimestamp = await Masonry.nextEpochPoint(); //in unix timestamp
    const currentEpoch = await Masonry.epoch();
    const mason = await Masonry.masons(this.myAccount);
    const startTimeEpoch = mason.epochTimerStart;
    const period = await Treasury.PERIOD();
    const periodInHours = period / 60 / 60; // 6 hours, period is displayed in seconds which is 21600
    const rewardLockupEpochs = await Masonry.rewardLockupEpochs();
    const targetEpochForClaimUnlock = Number(startTimeEpoch) + Number(rewardLockupEpochs);

    const fromDate = new Date(Date.now());
    if (targetEpochForClaimUnlock - currentEpoch <= 0) {
      return { from: fromDate, to: fromDate };
    } else if (targetEpochForClaimUnlock - currentEpoch === 1) {
      const toDate = new Date(nextEpochTimestamp * 1000);
      return { from: fromDate, to: toDate };
    } else {
      const toDate = new Date(nextEpochTimestamp * 1000);
      const delta = targetEpochForClaimUnlock - currentEpoch - 1;
      const endDate = moment(toDate)
        .add(delta * periodInHours, 'hours')
        .toDate();
      return { from: fromDate, to: endDate };
    }
  }

  /**
   * This method calculates and returns in a from to to format
   * the period the user needs to wait before being allowed to unstake
   * from the masonry
   * @returns Promise<AllocationTime>
   */
  async getUserUnstakeTime(): Promise<AllocationTime> {
    const { Masonry, Treasury } = this.contracts;
    const nextEpochTimestamp = await Masonry.nextEpochPoint();
    const currentEpoch = await Masonry.epoch();
    const mason = await Masonry.masons(this.myAccount);
    const startTimeEpoch = mason.epochTimerStart;
    const period = await Treasury.PERIOD();
    const PeriodInHours = period / 60 / 60;
    const withdrawLockupEpochs = await Masonry.withdrawLockupEpochs();
    const fromDate = new Date(Date.now());
    const targetEpochForClaimUnlock = Number(startTimeEpoch) + Number(withdrawLockupEpochs);
    const stakedAmount = await this.getStakedSharesOnMasonry();
    if (currentEpoch <= targetEpochForClaimUnlock && Number(stakedAmount) === 0) {
      return { from: fromDate, to: fromDate };
    } else if (targetEpochForClaimUnlock - currentEpoch === 1) {
      const toDate = new Date(nextEpochTimestamp * 1000);
      return { from: fromDate, to: toDate };
    } else {
      const toDate = new Date(nextEpochTimestamp * 1000);
      const delta = targetEpochForClaimUnlock - Number(currentEpoch) - 1;
      const endDate = moment(toDate)
        .add(delta * PeriodInHours, 'hours')
        .toDate();
      return { from: fromDate, to: endDate };
    }
  }

  async watchAssetInMetamask(assetName: string): Promise<boolean> {
    const { ethereum } = window as any;
    if (ethereum && ethereum.networkVersion === config.chainId.toString()) {
      let asset;
      let assetUrl;
      if (assetName === 'ECTO') {
        asset = this.ECTO;
        assetUrl = 'https://ecto.finance/presskit/ecto_icon_noBG.png';
      } else if (assetName === 'ESHARE') {
        asset = this.ESHARE;
        assetUrl = 'https://ecto.finance/presskit/tshare_icon_noBG.png';
      } else if (assetName === 'EBOND') {
        asset = this.EBOND;
        assetUrl = 'https://ecto.finance/presskit/tbond_icon_noBG.png';
      }
      await ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: asset.address,
            symbol: asset.symbol,
            decimals: 18,
            image: assetUrl,
          },
        },
      });
    }
    return true;
  }

  async provideEctoFtmLP(ftmAmount: string, ectoAmount: BigNumber): Promise<TransactionResponse> {
    const { TaxOffice } = this.contracts;
    let overrides = {
      value: parseUnits(ftmAmount, 18),
    };
    return await TaxOffice.addLiquidityETHTaxFree(
      ectoAmount,
      ectoAmount.mul(992).div(1000),
      parseUnits(ftmAmount, 18).mul(992).div(1000),
      overrides,
    );
  }

  async quoteFromSpooky(tokenAmount: string, tokenName: string): Promise<string> {
    const { SpookyRouter } = this.contracts;
    const { _reserve0, _reserve1 } = await this.ECTOWFTM_LP.getReserves();
    let quote;
    if (tokenName === 'ECTO') {
      quote = await SpookyRouter.quote(parseUnits(tokenAmount), _reserve1, _reserve0);
    } else {
      quote = await SpookyRouter.quote(parseUnits(tokenAmount), _reserve0, _reserve1);
    }
    return (quote / 1e18).toString();
  }

  /**
   * @returns an array of the regulation events till the most up to date epoch
   */
  async listenForRegulationsEvents(): Promise<any> {
    const { Treasury } = this.contracts;

    const treasuryDaoFundedFilter = Treasury.filters.DaoFundFunded();
    const treasuryDevFundedFilter = Treasury.filters.DevFundFunded();
    const treasuryMasonryFundedFilter = Treasury.filters.MasonryFunded();
    const boughtBondsFilter = Treasury.filters.BoughtBonds();
    const redeemBondsFilter = Treasury.filters.RedeemedBonds();

    let epochBlocksRanges: any[] = [];
    let masonryFundEvents = await Treasury.queryFilter(treasuryMasonryFundedFilter);
    var events: any[] = [];
    masonryFundEvents.forEach(function callback(value, index) {
      events.push({ epoch: index + 1 });
      events[index].masonryFund = getDisplayBalance(value.args[1]);
      if (index === 0) {
        epochBlocksRanges.push({
          index: index,
          startBlock: value.blockNumber,
          boughBonds: 0,
          redeemedBonds: 0,
        });
      }
      if (index > 0) {
        epochBlocksRanges.push({
          index: index,
          startBlock: value.blockNumber,
          boughBonds: 0,
          redeemedBonds: 0,
        });
        epochBlocksRanges[index - 1].endBlock = value.blockNumber;
      }
    });

    epochBlocksRanges.forEach(async (value, index) => {
      events[index].bondsBought = await this.getBondsWithFilterForPeriod(
        boughtBondsFilter,
        value.startBlock,
        value.endBlock,
      );
      events[index].bondsRedeemed = await this.getBondsWithFilterForPeriod(
        redeemBondsFilter,
        value.startBlock,
        value.endBlock,
      );
    });
    let DEVFundEvents = await Treasury.queryFilter(treasuryDevFundedFilter);
    DEVFundEvents.forEach(function callback(value, index) {
      events[index].devFund = getDisplayBalance(value.args[1]);
    });
    let DAOFundEvents = await Treasury.queryFilter(treasuryDaoFundedFilter);
    DAOFundEvents.forEach(function callback(value, index) {
      events[index].daoFund = getDisplayBalance(value.args[1]);
    });
    return events;
  }

  /**
   * Helper method
   * @param filter applied on the query to the treasury events
   * @param from block number
   * @param to block number
   * @returns the amount of bonds events emitted based on the filter provided during a specific period
   */
  async getBondsWithFilterForPeriod(filter: EventFilter, from: number, to: number): Promise<number> {
    const { Treasury } = this.contracts;
    const bondsAmount = await Treasury.queryFilter(filter, from, to);
    return bondsAmount.length;
  }

  async estimateZapIn(tokenName: string, lpName: string, amount: string): Promise<number[]> {
    const { zapper } = this.contracts;
    const lpToken = this.externalTokens[lpName];
    let estimate;
    if (tokenName === FTM_TICKER) {
      estimate = await zapper.estimateZapIn(lpToken.address, SPOOKY_ROUTER_ADDR, parseUnits(amount, 18));
    } else {
      const token = tokenName === ECTO_TICKER ? this.ECTO : this.ESHARE;
      estimate = await zapper.estimateZapInToken(
        token.address,
        lpToken.address,
        SPOOKY_ROUTER_ADDR,
        parseUnits(amount, 18),
      );
    }
    return [estimate[0] / 1e18, estimate[1] / 1e18];
  }
  async zapIn(tokenName: string, lpName: string, amount: string): Promise<TransactionResponse> {
    const { zapper } = this.contracts;
    const lpToken = this.externalTokens[lpName];
    if (tokenName === FTM_TICKER) {
      let overrides = {
        value: parseUnits(amount, 18),
      };
      return await zapper.zapIn(lpToken.address, SPOOKY_ROUTER_ADDR, this.myAccount, overrides);
    } else {
      const token = tokenName === ECTO_TICKER ? this.ECTO : this.ESHARE;
      return await zapper.zapInToken(
        token.address,
        parseUnits(amount, 18),
        lpToken.address,
        SPOOKY_ROUTER_ADDR,
        this.myAccount,
      );
    }
  }
  async swapEBondToEShare(tbondAmount: BigNumber): Promise<TransactionResponse> {
    const { EShareSwapper } = this.contracts;
    return await EShareSwapper.swapEBondToEShare(tbondAmount);
  }
  async estimateAmountOfEShare(tbondAmount: string): Promise<string> {
    const { EShareSwapper } = this.contracts;
    try {
      const estimateBN = await EShareSwapper.estimateAmountOfEShare(parseUnits(tbondAmount, 18));
      return getDisplayBalance(estimateBN, 18, 6);
    } catch (err) {
      console.error(`Failed to fetch estimate tshare amount: ${err}`);
    }
  }

  async getEShareSwapperStat(address: string): Promise<EShareSwapperStat> {
    const { EShareSwapper } = this.contracts;
    const tshareBalanceBN = await EShareSwapper.getEShareBalance();
    const tbondBalanceBN = await EShareSwapper.getEBondBalance(address);
    // const ectoPriceBN = await EShareSwapper.getEctoPrice();
    // const tsharePriceBN = await EShareSwapper.getESharePrice();
    const rateESharePerEctoBN = await EShareSwapper.getEShareAmountPerEcto();
    const eshareBalance = getDisplayBalance(tshareBalanceBN, 18, 5);
    const ebondBalance = getDisplayBalance(tbondBalanceBN, 18, 5);
    return {
      eshareBalance: eshareBalance.toString(),
      ebondBalance: ebondBalance.toString(),
      // ectoPrice: ectoPriceBN.toString(),
      // tsharePrice: tsharePriceBN.toString(),
      rateESharePerEcto: rateESharePerEctoBN.toString(),
    };
  }
}
