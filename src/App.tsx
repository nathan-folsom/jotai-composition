import React from 'react';
import styled from 'styled-components';
import { default as PickerBefore } from './components/picker/before/Picker';
import { default as PickerAfter } from './components/picker/after/Picker';
import { items } from './components/picker/items';

const Container = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
`;

function App() {
  return (
    <Container>
      <PickerBefore options={items} />
      <PickerAfter options={items} />
    </Container>
  );
}

export default App;
