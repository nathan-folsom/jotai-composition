import React from 'react';
import { Option, PickerState } from '../../types';
import styled from 'styled-components';
import { useAtom, useAtomValue } from 'jotai';

const Container = styled.div`
  flex: 1 1 100%;
  overflow-y: hidden;
`;

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

export type ListProps<T> = {
  state: PickerState<T>
}

export default function List<T>({ state }: ListProps<T>) {
  const options = useAtomValue(state.optionsAtom);
  const [selected, setSelected] = useAtom(state.selectedAtom);

  const handleClick = (option: Option<T>) => {
    return () => setSelected({ ...selected, [option.name]: !option.selected });
  }

  const ListItem = ({ option: o }: { option: Option<T> }) => {
    if (o.hidden) return null;
    return (
      <Item key={o.name} onClick={handleClick(o)}>
        <p key={o.name}>{o.name}</p>
        <input type={'checkbox'} checked={!!o.selected} onChange={handleClick(o)}/>
      </Item>
    )
  }

  return (
    <Container>
      {options.map(o => <ListItem key={o.name} option={o} />)}
    </Container>
  )
}
