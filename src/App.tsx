import React from 'react';
import styled from 'styled-components';
import { default as PickerBefore } from './components/picker/before/Picker';
import { default as PickerAfter } from './components/picker/after/Picker';
import { items } from './components/picker/items';
import List from './components/picker/after/subcomponents/List';
import Search from './components/picker/after/subcomponents/Search';

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
      <PickerAfter options={items}>
        {state => (
          <>
            <Search state={state} />
            <List state={state} />
          </>
        )}
      </PickerAfter>
    </Container>
  );
}

export default App;
