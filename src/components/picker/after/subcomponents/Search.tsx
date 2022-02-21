import React, { useEffect, useState } from 'react';
import { PickerState } from '../../types';
import { useAtomValue } from 'jotai';
import styled from 'styled-components';
import { useUpdateAtom } from 'jotai/utils';

const SearchInput = styled.input`
  margin: 10px 10px 0;
  padding: 5px;
`;

export type SearchProps = {
  state: PickerState;
}

export default function Search({ state }: SearchProps) {
  const [search, setSearch] = useState("");
  const options = useAtomValue(state.optionsAtom);
  const setHidden = useUpdateAtom(state.hiddenAtom);

  useEffect(() => {
    const updates = options.reduce((hidden: Record<string, boolean>, current) => {
      hidden[current.name] = !current.name.includes(search);
      return hidden;
    }, {});

    if (options.some(o => !!o.hidden !== updates[o.name])) setHidden(updates);
  }, [options, search, setHidden]);

  return <SearchInput value={search} onChange={e => setSearch(e.target.value)}/>;
}
