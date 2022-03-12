import React from 'react';
import styled from 'styled-components';
import { useAtomValue } from 'jotai';
import ListItem from './ListItem';
import { pickerScope, pickerState } from "../state";

const Container = styled.div`
  flex: 1 1 100%;
  overflow-y: hidden;
`;

export default function List() {
  const options = useAtomValue(pickerState.optionsAtom, pickerScope);

  return (
    <Container>
      {options.map(o => <ListItem key={o.name} option={o} />)}
    </Container>
  )
}
