import { WritableAtom } from "jotai";

export type Option<T> = {
  name: string;
  hidden?: boolean;
  selected?: boolean;
} & T;

export type PickerState<T> = {
  optionsAtom: WritableAtom<Option<T>[], Option<T>[]>;
  hiddenAtom: WritableAtom<Record<string, boolean>, Record<string, boolean>>;
  selectedAtom: WritableAtom<Record<string, boolean>, Record<string, boolean>>;
}
