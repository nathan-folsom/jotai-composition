# Composition in Reusable Components with Jotai
In this article I'm going to be showing a design pattern for maximizing composition in reusable React components
using the state management library Jotai. If you're not familiar with Jotai [check it out](https://jotai.org/), or keep 
reading; its not too complicated!

I'm using the example of a universal picker component that renders a list of items, and allows the user to select
some items. Here is a very minimal example that implements the most basic functionality. Some type definitions and
styling have been omitted, [visit the GitHub repository](https://github.com/nathan-folsom/jotai-composition)
to see all of the code.

    ...
    
    export type PickerProps = {
      options: Option[];
    }

    export default function Picker({ options }: PickerProps) {
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
bar! The simplest way to go about adding search functionality is to just add a prop that conditionally renders a search input
and to implement the search logic within the component.

    ...

    export type PickerProps = {
      options: Option[]; 
      enableSearch: boolean;
    }

    export default function Picker({ options, enableSearch }: PickerProps) {
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

Obviously the component is still quite lightweight and readable so I wouldn't normally refactor at this 
point, but for the sake of this article there are some improvements to be made. Adding functionality in this manner
causes the component to increasingly grow in complexity over time. The more props and functionality you add,
the higher the chance that there will be some clashing logic, or that it will simply become too big to easily maintain.
We can already see this starting to happen where the list is being rendered. The rendering logic now has to take into
account the search filtering as well as the logic for mapping options to list items. So what do we do about it?

##Composition
With a couple of tricks and some help from Jotai, we can encapsulate logic into smaller components; and then combine
them to build something bigger. Just as the React gods intended.
First, let's break down the component into it's logical units:  
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
within the State Container, while allowing the state to reside only within the State Container and not be a part of global state.
This also allows us to place props that are specific to a subcomponent on the subcomponent itself. Say for example that we
wanted to implement some custom search filtering logic that filtered by more than just the `name` field on the option.
We could easily modify the `Search` component and use it as so:

      ...

          <Search state={state} searchFields={["name", "value"]} />

      ...

##Internal State
Let's take a look at how the internal state works.

###State Container:

    export type PickerProps = {
      options: Option[];
      children: (state: PickerState) => ReactNode;
    }

    export default function Picker({ options, children }: PickerProps) {
      const state = useRef<PickerState>(initializeState());
      const setOptions = useUpdateAtom(state.current.optionsAtom);

      useEffect(() => {
        setOptions(options);
      }, [options, setOptions]);

      return (
        <Container>
          {children(state.current)}
        </Container>
      );
    }

The important things to note here are the usage of the `children` prop, and internal state within `useRef`.
`useRef` assures that our atoms are created once and persist throughout the lifecycle of the component. The shape of
the state object is also worth taking a look at:

    type PickerState = {
        optionsAtom: WritableAtom<Option[], Option[]>;
        hiddenAtom: WritableAtom<Record<string, boolean>, Record<string, boolean>>;
        selectedAtom: WritableAtom<Record<string, boolean>, Record<string, boolean>>;
    }

The `hiddenAtom` holds a map of items that are currently hidden, the `selectedAtom` holds a map of items that are
selected, and the `optionsAtom` holds a list of items that are automatically combined with the values held within the
previous two atoms. If you want to see how that works, take a look at [`initializeState.ts`](https://github.com/nathan-folsom/jotai-composition/blob/master/src/components/picker/after/functions/initializeState.ts)
and [`combinedUpdatesAtom.ts`](https://github.com/nathan-folsom/jotai-composition/blob/master/src/components/picker/after/functions/combinedUpdatesAtom.ts).

###List Renderer

As we can see here, there is no longer any filtering involved in rendering the list. The only thing that the component
is paying attention to now is the list of items that it is provided with in state.

    export default function List({ state }: ListProps) {
      const [options, setOptions] = useAtom(state.displayOptionsAtom);

      const handleClick = (name: string) => {
        return () => setOptions(options.map(o => o.name === name ? { ...o, selected: !o.selected } : o));
      }

      const ListItem = ({ option: o }: { option: Option }) => {
        if (o.hidden) return null;
        return (
          <Item key={o.name} onClick={handleClick(o.name)}>
            <p key={o.name}>{o.name}</p>
            <input type={'checkbox'} checked={!!o.selected} onChange={handleClick(o.name)}/>
          </Item>
        )
      }

      return (
        <Container>
          {options.map(o => <ListItem key={o.name} option={o} />)}
        </Container>
      )
    }

## Search Input

And the search input also nicely contains all logic related to filtering the list of items to display, as well as 
rendering the actual input.

    export default function Search({ state }: SearchProps) {
      const [search, setSearch] = useState("");
      const inputOptions = useAtomValue(state.inputOptionsAtom);
      const setOptions = useUpdateAtom(state.displayOptionsAtom);

      useEffect(() => {
        setOptions(inputOptions.map(o => ({ ...o, hidden: !o.name.includes(search)})))
      }, [search, setOptions, inputOptions]);

      return <SearchInput value={search} onChange={e => setSearch(e.target.value)}/>;
    }

If we wanted to take things even further, we could create a `useFilterOptions` hook that would abstract the logic even
further and really make sure that the component was only concerned with rendering

