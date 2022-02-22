import { WritableAtom } from "jotai";

export type Option = {
  name: string;
  hidden?: boolean;
  selected?: boolean;
}

export type PickerState = {
  optionsAtom: WritableAtom<Option[], Option[]>;
  hiddenAtom: WritableAtom<Record<string, boolean>, Record<string, boolean>>;
  selectedAtom: WritableAtom<Record<string, boolean>, Record<string, boolean>>;
}
