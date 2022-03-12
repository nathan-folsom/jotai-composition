# Composable Reusable Components with Jotai

Part of a strong codebase is the tooling that has been built to augment work within the environment, and reusable components play a significant role. Well-designed common code can be the difference between enjoyable development and a massive headache, and is something I'm always trying to find new ways to think about. I recently began working with Jotai for state management, and it has led to some interesting patterns for composition in reusable React components. If you're not familiar with Jotai, you can [check it out here](https://jotai.org/), or keep reading; it's not too complicated!

For this example, I'm using a generic picker component that renders a list of items, and allows the user to select some.

Throughout this article, some type definitions and styling have been omitted for brevity, [visit the GitHub repository](https://github.com/nathan-folsom/jotai-composition) to see all the code.

Here is a very minimal example that implements the basic functionality:

```
function Picker({ options }: PickerProps) {
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});

  const handleClick = (name: string) => {
    return () => setSelectedItems(prev => ({ ...prev, [name]: !prev[name] }))
  }

  return (
    <Container>
      {options.map(o => (
        <Item key={o.name} onClick={handleClick(o.name)}>
          <p key={o.name}>{o.name}</p>
          <input type={'checkbox'} checked={selectedItems[o.name]} onChange={handleClick(o.name)}/>
        </Item>
      ))}
    </Container>
  );
}
```

This component is nice... until we run into use cases that require additional functionality. For example, a search bar! The simplest way to add search functionality is to add an `enableSearch` prop for backwards compatibility, and filtering logic within the component.

```
function Picker({ options, enableSearch }: PickerProps) {
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");

  const handleClick = (name: string) => {
    return () => setSelectedItems(prev => ({ ...prev, [name]: !prev[name] }))
  }

  return (
    <Container>
      {enableSearch && (
        <SearchInput value={search} onChange={e => setSearch(e.target.value)}/>
      )}
      {options
        .filter(o => o.name.includes(search))
        .map(o => (
          <Item key={o.name} onClick={handleClick(o.name)}>
            <p key={o.name}>{o.name}</p>
            <input type={'checkbox'} checked={selectedItems[o.name]} onChange={handleClick(o.name)}/>
          </Item>
        ))}
    </Container>
  );
}
```

Obviously the component is still quite lightweight and readable, but for the sake of this article let's start making improvements for scalability. If we keep adding functionality to `Picker` in the way that we added search filtering, the component will increasingly grow in complexity over time. The more props and functionality we add, the higher the chance that there will be clashing logic or that the component will simply become too big to easily maintain. The real problem here is that we're building the component *inside out* by continuously filling it with more functionality instead of building smaller pieces that can be composed together.

## Composition

With some help from Jotai we can make composable reusable logic; just as the React gods intended. First, let's break down the component into its logical units:

1. State Container (`Picker`): Keeps track of internal state.
2. List Renderer (`List`): Reads from state and renders items.
3. Search Input (`Search`): Modifies state depending on user input.
4. List Item (`ListItem`): Renders an item and modifies state when a user interacts with it.

Breaking things up in this way creates some additional overhead, but provides significant improvements in code cleanliness as the component becomes more complex. Here's what the composition looks like:

```
<Picker options={items}>
  <Search />
  <List />
</Picker>
```

This makes use of Jotai's `Provider` component to give the smaller components access to state, while keeping the state within the State Container. State is now accessed by hooks, which has big implications in terms of readability as it greatly reduces the amount of props that need to be passed around. Any logic dealing with state can now be contained within the subcomponent, and we can reserve props for logic that directly affects a subcomponent. Say for example that we wanted to add more options to the `Search` component:

```
...

  <Search caseSensitive debounceMs={500} />
  
...

```

The way to do this previously would have been to keep adding props to the `Picker` component and passing them to internal components, which is not an inherently scalable solution.

## Internal State

Next, let's take a look at internal state and how the components work together.

### State Container:

```
function Picker({ options, children }: PickerProps) {
  const setOptions = useUpdateAtom(pickerState.optionsAtom, pickerScope);

  useEffect(() => {
    setOptions(options);
  }, [options, setOptions]);

  return (
    <Container>
      {children}
    </Container>
  );
}

export default function provider(props: PickerProps) {
  return (
    <Provider scope={pickerScope}>
      <Picker {...props} />
    </Provider>
  )
}
```

The important things to note here are the usage of the Jotai `Provider` wrapping `Picker` and the state access via the `useUpdateAtom` hook. Both make use of a `scope` which assures that the `Provider` will capture all state and not allow it to be accessible globally. Additionally, all children of the scoped `Provider` will be allowed to access the same state, which is the core mechanism allowing us to compose a component in this manner. Another benefit of this setup is that when the `Picker` unmounts, its internal state will be automatically destroyed.

The shape of the state object is also worth taking a look at:

```
type PickerState = {
  optionsAtom: WritableAtom<Option[], Option[]>;
  hiddenAtom: WritableAtom<Record<string, boolean>, Record<string, boolean>>;
  selectedAtom: WritableAtom<Record<string, boolean>, Record<string, boolean>>;
}
```

`hiddenAtom` holds a map of items that are currently hidden, `selectedAtom` holds a map of items that are selected, and the `optionsAtom` holds a list of items that were originally passed to `Picker`. Values from the map atoms are merged into the list by setting properties on each list item:

```
type Option = {
  name: string;
  hidden?: boolean;
  selected?: boolean;
}
```

If you want to see how the merge works with Jotai, take a look at [initializeState.ts](https://github.com/nathan-folsom/jotai-composition/blob/master/src/components/picker/after/functions/initializeState.ts) and [combinedUpdatesAtom.ts](https://github.com/nathan-folsom/jotai-composition/blob/master/src/components/picker/after/functions/combinedUpdatesAtom.ts).

### List Renderer

This component only implements logic related to rendering the list. Clean!

```
function List() {
  const options = useAtomValue(pickerState.optionsAtom, pickerScope);

  return (
    <Container>
      {options.map(o => <ListItem key={o.name} option={o} />)}
    </Container>
  )
}
```

### Search Input

The search input nicely contains all logic needed to filter the list of items. In this case it checks for items whose name includes the search string before comparing the results with the current list of rendered items. If it finds any differences, it triggers a rerender by updating `hiddenAtom`.

```
function Search() {
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

  return <SearchInput value={search} onChange={e => setSearch(e.target.value)} />;
}
```

### List Item

By accessing the state object within our list items, we can move the click handling logic to the same place where the actual input component is being rendered.

```
function ListItem({ option: o }: ListItemProps) {
  const [selected, setSelected] = useAtom(pickerState.selectedAtom, pickerScope);

  const toggleSelected = () => {
    setSelected({ ...selected, [o.name]: !o.selected });
  }

  if (o.hidden) return null;
  return (
    <Item key={o.name} onClick={toggleSelected}>
      <p key={o.name}>{o.name}</p>
      <input type={'checkbox'} checked={!!o.selected} onChange={toggleSelected}/>
    </Item>
  )
}
```

## Wrapping Up

Instead of the whole `Picker` component growing as we add features to it, now it's just the state object that grows; and that's a good thing! A well organized state tree provides a lot of context and helps new eyes understand what is going on. Splitting components also reveals what exactly each is doing at a glance. As you may have noticed, all of our components are actually doing two things: Handling component logic *and* rendering html.

For codebases that contain multiple applications, this refactor could even be taken a step further by pulling all the logic that handles internal state out of the components. That way we could write and test the logic once and use it to build pickers with different appearances, or even with different underlying rendering engines such as mobile or command line!
