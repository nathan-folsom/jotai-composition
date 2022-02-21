import { Option, PickerState } from '../../types';
import { atom } from 'jotai';

export default function combinedUpdatesAtom(
  optionsAtom: PickerState['optionsAtom'],
  hiddenAtom: PickerState['hiddenAtom'],
  selectedAtom: PickerState['selectedAtom'],
) {
  return atom(
    get => {
      const hidden = get(hiddenAtom);
      const selected = get(selectedAtom);
      return get(optionsAtom).map(o => ({
        ...o,
        hidden: hidden[o.name],
        selected: selected[o.name]
      }));
    },
    (_get, set, update: Option[]) => {
      set(optionsAtom, update);
    }
  )
}
