import React from 'react';
import { Option } from '../types';
import styled from 'styled-components';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 400px;
  height: 500px;
  background: white;
  margin: 10px;
`;
const Item = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
`;

export type PickerProps<T> = {
  options: Option<T>[];
}

export default function Picker<T>({ options }: PickerProps<T>) {
  return (
    <Container>
      {options.map(o => (
        <Item key={o.name}>
          <p key={o.name}>{o.name}</p>
          <input type={'checkbox'}/>
        </Item>
      ))}
    </Container>
  );
}
