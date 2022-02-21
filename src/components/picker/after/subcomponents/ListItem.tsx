import React from 'react';
import { Option } from '../../types';
import styled from 'styled-components';

const Item = styled.button`
  background: none;
  border: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
  cursor: pointer;
  width: 100%;
`;

export type ListItemProps = {
  option: Option;
  onClick: () => void;
}

export default function ListItem({ option: o, onClick }: ListItemProps) {
  if (o.hidden) return null;
  return (
    <Item key={o.name} onClick={onClick}>
      <p key={o.name}>{o.name}</p>
      <input type={'checkbox'} checked={!!o.selected} onChange={onClick}/>
    </Item>
  )
}
