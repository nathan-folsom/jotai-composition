import React, { useEffect, useState } from 'react';
import { useAtomValue } from 'jotai';
import styled from 'styled-components';
import { useUpdateAtom } from 'jotai/utils';
import { pickerScope, pickerState } from "../state";

const SearchInput = styled.input`
  margin: 10px 10px 0;
  padding: 5px;
`;

export default function Search() {
  const [search, setSearch] = useState("");
  const options = useAtomValue(pickerState.optionsAtom, pickerScope);
  const setHidden = useUpdateAtom(pickerState.hiddenAtom, pickerScope);

  useEffect(() => {
    const updates = options.reduce((hidden: Record<string, boolean>, current) => {
      hidden[current.name] = !current.name.includes(search);
      return hidden;
    }, {});

    if (options.some(o => !!o.hidden !== updates[o.name])) setHidden(updates);
  }, [options, search, setHidden]);

  return <SearchInput value={search} onChange={e => setSearch(e.target.value)}/>;
}
