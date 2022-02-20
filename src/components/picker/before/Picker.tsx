import React, { useState } from 'react';
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
const Item = styled.button`
  background: none;
  border: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
  cursor: pointer;
`;

export type PickerProps<T> = {
  options: Option<T>[];
}

export default function Picker<T>({ options }: PickerProps<T>) {
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});

  const handleClick = (name: string) => {
    return () => setSelectedItems(prev => ({ ...prev, [name]: !prev[name]}))
  }

  return (
    <Container>
      {options.map(o => (
        <Item key={o.name} onClick={handleClick(o.name)}>
          <p key={o.name}>{o.name}</p>
          <input type={'checkbox'} checked={selectedItems[o.name]} onClick={handleClick(o.name)} />
        </Item>
      ))}
    </Container>
  );
}
