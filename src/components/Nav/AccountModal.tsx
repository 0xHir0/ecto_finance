import React, { useMemo } from 'react';
import styled from 'styled-components';
import useTokenBalance from '../../hooks/useTokenBalance';
import { getDisplayBalance } from '../../utils/formatBalance';

import Label from '../Label';
import Modal, { ModalProps } from '../Modal';
import ModalTitle from '../ModalTitle';
import useEctoFinance from '../../hooks/useEctoFinance';
import TokenSymbol from '../TokenSymbol';

const AccountModal: React.FC<ModalProps> = ({ onDismiss }) => {
  const ectoFinance = useEctoFinance();

  const ectoBalance = useTokenBalance(ectoFinance.ECTO);
  const displayEctoBalance = useMemo(() => getDisplayBalance(ectoBalance), [ectoBalance]);

  const eshareBalance = useTokenBalance(ectoFinance.ESHARE);
  const displayTshareBalance = useMemo(() => getDisplayBalance(eshareBalance), [eshareBalance]);

  const ebondBalance = useTokenBalance(ectoFinance.EBOND);
  const displayTbondBalance = useMemo(() => getDisplayBalance(ebondBalance), [ebondBalance]);

  return (
    <Modal>
      <ModalTitle text="My Wallet" />

      <Balances>
        <StyledBalanceWrapper>
          <TokenSymbol symbol="ECTO" />
          <StyledBalance>
            <StyledValue>{displayEctoBalance}</StyledValue>
            <Label text="ECTO Available" />
          </StyledBalance>
        </StyledBalanceWrapper>

        <StyledBalanceWrapper>
          <TokenSymbol symbol="ESHARE" />
          <StyledBalance>
            <StyledValue>{displayTshareBalance}</StyledValue>
            <Label text="ESHARE Available" />
          </StyledBalance>
        </StyledBalanceWrapper>

        <StyledBalanceWrapper>
          <TokenSymbol symbol="EBOND" />
          <StyledBalance>
            <StyledValue>{displayTbondBalance}</StyledValue>
            <Label text="EBOND Available" />
          </StyledBalance>
        </StyledBalanceWrapper>
      </Balances>
    </Modal>
  );
};

const StyledValue = styled.div`
  //color: ${(props) => props.theme.color.grey[300]};
  font-size: 30px;
  font-weight: 700;
`;

const StyledBalance = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
`;

const Balances = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  margin-bottom: ${(props) => props.theme.spacing[4]}px;
`;

const StyledBalanceWrapper = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  margin: 0 ${(props) => props.theme.spacing[3]}px;
`;

export default AccountModal;
