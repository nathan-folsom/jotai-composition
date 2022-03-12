import React, { PropsWithChildren, useEffect } from 'react';
import { Option } from '../types';
import styled from 'styled-components';
import { useUpdateAtom } from 'jotai/utils';
import { Provider } from 'jotai';
import { pickerScope, pickerState } from "./state";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 400px;
  height: 500px;
  background: white;
  margin: 10px;
`;

export type PickerProps = PropsWithChildren<{
  options: Option[];
}>;

function Picker({ options, children }: PickerProps) {
  const setOptions = useUpdateAtom(pickerState.optionsAtom, pickerScope);

  useEffect(() => {
    setOptions(options);
  }, [options, setOptions]);

  return (
    <Container>
      {children}
    </Container>
  );
}

export default function provider(props: PickerProps) {
  return (
    <Provider scope={pickerScope}>
      <Picker {...props} />
    </Provider>
  )
}