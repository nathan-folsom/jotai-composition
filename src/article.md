# Composable, Reusable Components with Jotai

Part of a strong codebase is the tooling that has been built to augment work within the environment, and reusable components play a significant role. Well-designed common code can be the difference between enjoyable development and a massive headache, and is something I'm always trying to find new ways to think about it. I recently began working with Jotai for state management, and it has led to some interesting patterns for composition in reusable React components. If you're not familiar with Jotai, you can [check it out here](https://jotai.org/), or keep reading; it's not too complicated!

For this example, I'm using a generic picker component that renders a list of items, and allows the user to select some.

Throughout this article, some type definitions and styling have been omitted for brevity, [visit the GitHub repository](https://github.com/nathan-folsom/jotai-composition) to see all the code.

Here is a very minimal example that implements the basic functionality:

    ...

    function Picker({ options }: PickerProps) {
      const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});

      const handleClick = (name: string) => {
        return () => setSelectedItems(prev => ({ ...prev, [name]: !prev[name]}))
      }

      return (
        <Container>
          {options.map(o => (
            <Item key={o.name} onClick={handleClick(o.name)}>
              <p key={o.name}>{o.name}</p>
              <input type={'checkbox'} checked={selectedItems[o.name]} onClick={handleClick(o.name)} />
            </Item>
          ))}
        </Container>
      );
    }

This component is nice... until we run into use cases that require additional functionality. For example, a search bar! The simplest way to add search functionality is to just add an `enableSearch` prop and filtering logic within the component.

    ...

    function Picker({ options, enableSearch }: PickerProps) {
      const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});
      const [search, setSearch] = useState("");

      const handleClick = (name: string) => {
        return () => setSelectedItems(prev => ({ ...prev, [name]: !prev[name]}))
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
                <input type={'checkbox'} checked={selectedItems[o.name]} onClick={handleClick(o.name)} />
              </Item>
            ))}
        </Container>
      );
    }

Obviously the component is still quite lightweight and readable, but for the sake of this article let's start making improvements for future usability. If we keep adding functionality to `Picker` in the way that we added search filtering, the component will increasingly grow in complexity over time. The more props and functionality we add, the higher the chance that there will be clashing logic or that the component will simply become too big to easily maintain. The real problem here is that we're building the component *inside out* by continuously filling it with more functionality instead of building smaller pieces that can be composed together.

## Composition

With a couple of tricks and some help from Jotai, we can make composable reusable logic; just as the React gods intended. First, let's break down the component into its logical units:

1. State Container (`Picker`): Keeps track of internal state.
2. List Renderer (`List`): Reads from state and renders items.
3. Search Input (`Search`): Modifies state depending on user input.
4. List Item (`ListItem`): Reads and modifies state on user selection.

Breaking things up in this way creates some additional overhead, but provides significant advantages in terms of code cleanliness as the component becomes more complex. Here's what the composition looks like at the top level:

    <Picker options={items}>
      {state => (
        <>
          <Search state={state} />
          <List state={state} />
        </>
      )}
    </Picker>

This makes use of React's [render props](https://reactjs.org/docs/render-props.html) to compose the smaller components as children of the State Container, while allowing the state to reside within the State Container. Passing around a state object has big implications in terms of readability, as it greatly reduces the amount of props that need to be passed around. Any logic dealing with state can now be contained within the subcomponent, and we can place props that affect a subcomponent directly on that subcomponent. Say for example that we wanted to add more filtering options to the `Search` component:

    ...

      <Search state={state} caseSensitive hideNames={["foo"]} />

    ...

The only way to do this previously would be to keep adding props to the `Picker` component, which is not an inherently scalable solution.

## Internal State

Next, let's take a look at internal state and how the components work together.

### State Container:

    function Picker({ options, children }: PickerProps) {
      const state = useRef<PickerState>(initializeState());

    ...

      return (
        <Container>
          {children(state.current)}
        </Container>
      );
    }

The important things to note here are the usage of the `children` prop, and internal state within `useRef`. The `children` prop is a function that we call with the state object in order to pass it down to the actual child components. Storing state in a `useRef` assures that our state object is created once and persists throughout the lifecycle of the component, as well as being automatically destroyed when the component unmounts.

The shape of the state object is also worth taking a look at:

    type PickerState = {
        optionsAtom: WritableAtom<Option[], Option[]>;
        hiddenAtom: WritableAtom<Record<string, boolean>, Record<string, boolean>>;
        selectedAtom: WritableAtom<Record<string, boolean>, Record<string, boolean>>;
    }

`hiddenAtom` holds a map of items that are currently hidden, `selectedAtom` holds a map of items that are selected, and the `optionsAtom` holds a list of items that were originally passed to `Picker`. Updates from the map atoms are merged into the list by setting properties on each item to be used later:

    type Option = {
      name: string;
      hidden?: boolean;
      selected?: boolean;
    };

If you want to see how the merge works with Jotai, take a look at [initializeState.ts](https://github.com/nathan-folsom/jotai-composition/blob/master/src/components/picker/after/functions/initializeState.ts) and [combinedUpdatesAtom.ts](https://github.com/nathan-folsom/jotai-composition/blob/master/src/components/picker/after/functions/combinedUpdatesAtom.ts).

### List Renderer

This component now only implements logic related to rendering the list. Clean!

    export default function List({ state }: ListProps) {
      const options = useAtomValue(state.optionsAtom);

      return (
        <Container>
          {options.map(o => <ListItem key={o.name} option={o} state={state} />)}
        </Container>
      )
    }

## Search Input

The search input nicely contains all logic related to filtering the list of items to display. In this case it checks for items whose name includes the search string before comparing the results with the current list of rendered items. If it finds any differences, it triggers a rerender by updating `hiddenAtom`.

    function Search({ state }: SearchProps) {
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

### List Item

By passing the state object to our list items, we can move the click handling logic to the same place where the actual input component is being rendered.

    export default function ListItem({ option: o, state }: ListItemProps) {
      const [selected, setSelected] = useAtom(state.selectedAtom);

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

## Wrapping Up

Instead of the whole `Picker` component growing as we add features to it, now we just have to edit the state object; and that's a good thing! A well organized state tree provides a lot of context and helps new eyes understand what is going on. Splitting components also reveals what exactly each is doing at a glance. As you may have noticed, all of our components are actually doing two things: Handling component logic *and* rendering html.

For codebases that contain multiple applications, this refactor could be taken a step further to go from a web component into a truly reusable React component that exists outside of rendering. Write and test the component logic once and use it to build pickers with different appearances, or even with different underlying rendering engines such as mobile or command line.
