import React, { ReactNode, useEffect, useRef } from 'react';
import { Option, PickerState } from '../types';
import styled from 'styled-components';
import { atom } from 'jotai';
import { useUpdateAtom } from 'jotai/utils';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 400px;
  height: 500px;
  background: white;
  margin: 10px;
`;

export type PickerProps<T> = {
  options: Option<T>[];
  children: (state: PickerState<T>) => ReactNode;
}

export default function Picker<T>({ options, children }: PickerProps<T>) {
  const state = useRef<PickerState<T>>({
    inputOptionsAtom: atom<Option<T>[]>([]),
    displayOptionsAtom: atom<Option<T>[]>([]),
    searchAtom: atom(""),
  })
  const setOptions = useUpdateAtom(state.current.inputOptionsAtom);

  useEffect(() => {
    setOptions(options);
  }, [options, setOptions]);

  return (
    <Container>
      {children(state.current)}
    </Container>
  );
}
