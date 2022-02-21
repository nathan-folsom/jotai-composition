import { atom } from 'jotai';
import { Option, PickerState } from '../../types';
import combinedUpdatesAtom from './combinedUpdatesAtom';

export default function initializeState<T>(): PickerState<T> {
  const inputOptionsAtom = atom<Option<T>[]>([]);
  const hiddenItemsAtom = atom<Record<string, boolean>>({});
  const selectedItemsAtom = atom<Record<string, boolean>>({});
  const optionsAtom = combinedUpdatesAtom(inputOptionsAtom, hiddenItemsAtom, selectedItemsAtom);

  return {
    optionsAtom,
    hiddenAtom: hiddenItemsAtom,
    selectedAtom: selectedItemsAtom,
  }
}
