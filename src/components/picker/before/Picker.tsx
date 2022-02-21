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
const SearchInput = styled.input`
  margin: 10px 10px 0;
  padding: 5px;
`;

export type PickerProps = {
  options: Option[];
  enableSearch?: boolean;
}

export default function Picker({ options, enableSearch }: PickerProps) {
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");

  const handleClick = (name: string) => {
    return () => setSelectedItems(prev => ({ ...prev, [name]: !prev[name] }))
  }

  return (
    <Container>
      {enableSearch && (
        <SearchInput value={search} onChange={e => setSearch(e.target.value)}/>
      )}
      {options
        .filter(o => o.name.includes(search))
        .map(o => (
          <Item key={o.name} onClick={handleClick(o.name)}>
            <p key={o.name}>{o.name}</p>
            <input type={'checkbox'} checked={selectedItems[o.name]} onChange={handleClick(o.name)}/>
          </Item>
        ))}
    </Container>
  );
}
