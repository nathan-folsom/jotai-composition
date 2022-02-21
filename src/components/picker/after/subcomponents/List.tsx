import React from 'react';
import { Option, PickerState } from '../../types';
import styled from 'styled-components';
import { useAtom, useAtomValue } from 'jotai';
import ListItem from './ListItem';

const Container = styled.div`
  flex: 1 1 100%;
  overflow-y: hidden;
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

  return (
    <Container>
      {options.map(o => <ListItem key={o.name} onClick={handleClick(o)} option={o} />)}
    </Container>
  )
}
