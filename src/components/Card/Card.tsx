import React from 'react';
import styled from 'styled-components';

const Card: React.FC = ({ children }) => <StyledCard>{children}</StyledCard>;

const StyledCard = styled.div`
  background-color: rgba(52, 190, 130, 0.9); //${(props) => props.theme.color.grey[800]};
  color: #001e6c !important;
  display: flex;
  flex: 1;
  flex-direction: column;
`;

export default Card;
