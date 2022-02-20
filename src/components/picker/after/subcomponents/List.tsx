import React from 'react';
import { Option, PickerState } from '../../types';
import styled from 'styled-components';
import { useAtom } from 'jotai';

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
  const [options, setOptions] = useAtom(state.displayOptionsAtom);

  const handleClick = (name: string) => {
    return () => setOptions(options.map(o => o.name === name ? { ...o, selected: !o.selected } : o));
  }

  const ListItem = ({ option: o }: { option: Option<T> }) => {
    if (o.hidden) return null;
    return (
      <Item key={o.name} onClick={handleClick(o.name)}>
        <p key={o.name}>{o.name}</p>
        <input type={'checkbox'} checked={!!o.selected} onChange={handleClick(o.name)}/>
      </Item>
    )
  }

  return (
    <Container>
      {options.map(o => <ListItem key={o.name} option={o} />)}
    </Container>
  )
}
