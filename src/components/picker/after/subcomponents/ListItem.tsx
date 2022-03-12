import React from 'react';
import { Option } from '../../types';
import styled from 'styled-components';
import { useAtom } from 'jotai';
import { pickerScope, pickerState } from "../state";

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
}

export default function ListItem({ option: o }: ListItemProps) {
  const [selected, setSelected] = useAtom(pickerState.selectedAtom, pickerScope);

  const toggleSelected = () => {
    setSelected({ ...selected, [o.name]: !o.selected });
  }

  if (o.hidden) return null;
  return (
    <Item key={o.name} onClick={toggleSelected}>
      <p key={o.name}>{o.name}</p>
      <input type={'checkbox'} checked={!!o.selected} onChange={toggleSelected}/>
    </Item>
  )
}
