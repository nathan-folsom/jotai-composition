import { atom } from 'jotai';
import { Option, PickerState } from '../../types';
import combinedUpdatesAtom from './combinedUpdatesAtom';

export default function initializeState(): PickerState {
  const inputOptionsAtom = atom<Option[]>([]);
  const hiddenAtom = atom<Record<string, boolean>>({});
  const selectedAtom = atom<Record<string, boolean>>({});
  const optionsAtom = combinedUpdatesAtom(inputOptionsAtom, hiddenAtom, selectedAtom);

  return {
    optionsAtom,
    hiddenAtom,
    selectedAtom,
  }
}
