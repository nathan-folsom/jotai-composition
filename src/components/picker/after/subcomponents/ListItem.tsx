import React from 'react';
import { Option, PickerState } from '../../types';
import styled from 'styled-components';
import { useAtom } from 'jotai';

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
  state: PickerState;
}

export default function ListItem({ option: o, state }: ListItemProps) {
  const [selected, setSelected] = useAtom(state.selectedAtom);

  const handleClick = () => {
    setSelected({ ...selected, [o.name]: !o.selected });
  }

  if (o.hidden) return null;
  return (
    <Item key={o.name} onClick={handleClick}>
      <p key={o.name}>{o.name}</p>
      <input type={'checkbox'} checked={!!o.selected} onChange={handleClick}/>
    </Item>
  )
}
