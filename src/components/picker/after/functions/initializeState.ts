import { atom } from 'jotai';
import { Option, PickerState } from '../../types';
import combinedUpdatesAtom from './combinedUpdatesAtom';

export default function initializeState(): PickerState {
  const inputOptionsAtom = atom<Option[]>([]);
  const hiddenItemsAtom = atom<Record<string, boolean>>({});
  const selectedItemsAtom = atom<Record<string, boolean>>({});
  const optionsAtom = combinedUpdatesAtom(inputOptionsAtom, hiddenItemsAtom, selectedItemsAtom);

  return {
    optionsAtom,
    hiddenAtom: hiddenItemsAtom,
    selectedAtom: selectedItemsAtom,
  }
}
