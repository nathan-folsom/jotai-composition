import React from 'react';
import { PickerState } from '../../types';
import styled from 'styled-components';
import { useAtomValue } from 'jotai';
import ListItem from './ListItem';

const Container = styled.div`
  flex: 1 1 100%;
  overflow-y: hidden;
`;

export type ListProps = {
  state: PickerState
}

export default function List({ state }: ListProps) {
  const options = useAtomValue(state.optionsAtom);

  return (
    <Container>
      {options.map(o => <ListItem key={o.name} option={o} state={state} />)}
    </Container>
  )
}
