import { WritableAtom } from "jotai";

export type Option<T> = {
  name: string;
  hidden?: boolean;
  selected?: boolean;
} & T;

export type PickerState<T> = {
  inputOptionsAtom: WritableAtom<Option<T>[], Option<T>[]>;
  displayOptionsAtom: WritableAtom<Option<T>[], Option<T>[]>;
}
