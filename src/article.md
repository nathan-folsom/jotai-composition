# Composition in Reusable Components with Jotai, Part 1

In my never-ending quest for clean code, I came up with a pattern for maximizing composition in reusable React
components using Jotai. Jotai is a React state management library, you can [check it out here](https://jotai.org/) if
you're not familiar, or keep reading; it's not too complicated!

I'm using the example of a universal picker component that renders a list of items, and allows the user to select some
items. Here is a very minimal example that implements the most basic functionality. Some type definitions and styling
have been omitted, [visit the GitHub repository](https://github.com/nathan-folsom/jotai-composition)
to see all the code.

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

This component is nice... until we run into use cases that require some additional functionality. For example, a search
bar! The simplest way to go about adding search functionality is to just add a prop that conditionally renders a search
input and to implement the search logic within the component.

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

Obviously the component is still quite lightweight and readable, but for the sake of this article let's start making
some improvements. The way we added search functionality causes the component to increasingly grow in complexity over
time. The more props and functionality we add, the higher the chance that there will be clashing logic or that the
component will simply become too big to easily maintain. The real problem here is that we're building the component *
inside out* by continuously filling it with more functionality instead of building smaller pieces that can be composed
together.

## Composition

With a couple of tricks and some help from Jotai, we can make composable reusable logic. Just as the React gods
intended. First, let's break down the component into its logical units:

1. State Container: Keeps track of internal state.
2. List Renderer: Reads from state and renders items.
3. Search Input: Modifies state depending on user input.

Breaking things up in this way creates some additional overhead, but provides significant advantages in terms of code
cleanliness as a component becomes more complex. Here's what the composition looks like at the top level:

    <Picker options={items}>
      {state => (
        <>
          <Search state={state} />
          <List state={state} />
        </>
      )}
    </Picker>

This makes use of React's [render props](https://reactjs.org/docs/render-props.html) to compose the smaller components
as children of the State Container, while allowing the state to reside within the State Container. This also allows us
to place props that affect a subcomponent directly on the subcomponent. Say for example that we wanted to add more
filtering options to the `Search` component:

    ...

      <Search state={state} caseSensitive hideNames={["zap"]} />

    ...

## Internal State

Next, let's take a look at internal state and how the components work together.

### State Container:

    function Picker({ options, children }: PickerProps) {
      const state = useRef<PickerState>(initializeState());
      const setOptions = useUpdateAtom(state.current.optionsAtom);

    ...

      return (
        <Container>
          {children(state.current)}
        </Container>
      );
    }

The important things to note here are the usage of the `children` prop, and internal state within `useRef`.
The `children` prop is a function that we call with the state object in order to pass it down to the actual child
components. Storing state in a `useRef` assures that our atoms are created once and persist throughout the lifecycle of
the component. The shape of the state object is also worth taking a look at:

    type PickerState = {
        optionsAtom: WritableAtom<Option[], Option[]>;
        hiddenAtom: WritableAtom<Record<string, boolean>, Record<string, boolean>>;
        selectedAtom: WritableAtom<Record<string, boolean>, Record<string, boolean>>;
    }

`hiddenAtom` holds a map of items that are currently hidden, `selectedAtom` holds a map of items that are selected, and
the `optionsAtom` holds a list of items that are automatically combined with the values held within the previous two
atoms. The updates are merged into the list by setting properties on each item based on the values in each map:

    type Option = {
      name: string;
      hidden?: boolean; // Set by combining with hiddenAtom, if true this item won't be rendered
      selected?: boolean; // Set by combining with selectedAtom, if true this item will be rendered with a checked input
    };

If you want to see how the merge works with Jotai, take a look
at [initializeState.ts](https://github.com/nathan-folsom/jotai-composition/blob/master/src/components/picker/after/functions/initializeState.ts)
and [combinedUpdatesAtom.ts](https://github.com/nathan-folsom/jotai-composition/blob/master/src/components/picker/after/functions/combinedUpdatesAtom.ts)
.

### List Renderer

After the refactor, we have successfully removed the filtering logic from this component. Now, the List Renderer only
has to read the list of items from state, and modify state when a user selects from the list.

    function List({ state }: ListProps) {
      const options = useAtomValue(state.optionsAtom);
      const [selected, setSelected] = useAtom(state.selectedAtom);

      const handleClick = (option: Option) => {
        return () => setSelected({ ...selected, [option.name]: !option.selected });
      }

      return (
        <Container>
          {options.map(o => <ListItem key={o.name} onClick={handleClick(o)} option={o} />)}
        </Container>
      )
    }

## Search Input

The search input nicely contains all logic related to filtering the list of items to display. In this case it checks for
items whose name includes the search string, before comparing the results with the current list of rendered items. If it
finds any differences, it triggers a rerender by updating `hiddenAtom`.

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

## Wrapping Up

Instead of the whole `Picker` component growing as we add features to it, now we just have to add to the state object;
and that's a good thing! A well organized state tree provides a lot of context and helps understand what is going on for
someone that is new to the code. Splitting things up in this way also makes it a lot clearer what exactly each component
is doing. As you may have noticed, each component is still actually doing two things: Handling component logic, and
rendering html.

Stay tuned for part 2, where we will take `Picker` and turn it from a reusable web component into a truly reusable React
component that exists outside of rendering.
