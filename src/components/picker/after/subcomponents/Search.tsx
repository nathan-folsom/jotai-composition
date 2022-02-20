import React, { useEffect } from 'react';
import { PickerState } from '../../types';
import { useAtom, useAtomValue } from 'jotai';
import styled from 'styled-components';
import { useUpdateAtom } from 'jotai/utils';

const SearchInput = styled.input`
  margin: 10px 10px 0;
  padding: 5px;
`;

export type SearchProps<T> = {
  state: PickerState<T>;
}

export default function Search<T>({ state }: SearchProps<T>) {
  const [search, setSearch] = useAtom(state.searchAtom);
  const inputOptions = useAtomValue(state.inputOptionsAtom);
  const setOptions = useUpdateAtom(state.displayOptionsAtom);

  useEffect(() => {
    setOptions(inputOptions.map(o => ({ ...o, hidden: !o.name.includes(search)})))
  }, [search, setOptions, inputOptions]);

  return <SearchInput value={search} onChange={e => setSearch(e.target.value)}/>;
}
