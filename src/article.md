# Composition in Reusable Components with Jotai
In this article I'm going to be showing a design pattern for maximizing composition in reusable React components
using the state management library Jotai. If you're not familiar with Jotai [check it out](https://jotai.org/), or keep 
reading; its not too complicated!

I'm using the example of a universal picker component that renders a list of items, and allows the user to select
some items. Here is a very minimal example that implements the most basic functionality. Some type definitions and
styling have been omitted, [visit the GitHub repository](https://github.com/nathan-folsom/jotai-composition)
to see all of the code.

    ...
    
    export type PickerProps<T> = {
      options: Option<T>[];
    }

    export default function Picker<T>({ options }: PickerProps<T>) {
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

    export type PickerProps<T> = {
      options: Option<T>[]; 
      enableSearch: boolean;
    }

    export default function Picker<T>({ options, enableSearch }: PickerProps<T>) {
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

    export type PickerProps<T> = {
      options: Option<T>[];
      children: (state: PickerState<T>) => ReactNode;
    }

    export default function Picker<T>({ options, children }: PickerProps<T>) {
      const state = useRef<PickerState<T>>({
        inputOptionsAtom: atom<Option<T>[]>([]),
        displayOptionsAtom: atom<Option<T>[]>([]),
      });

    ...

      return (
        <Container>
          {children(state.current)}
        </Container>
      );
    }

The important things to note here are the usage of the `children` prop, and internal state within `useRef`.
`useRef` assures that our atoms are created once and persist throughout the lifecycle of the component. As we will see
later, each atom is similar to a useState and child components can choose which atoms to pay attention to for optimized
rerendering. In this component we have two atoms:
* `inputOptionsAtom` stores the options that were provided to the `Picker` component as props.
* `displayOptionsAtom` stores an updated copy of the options, which allows for mutating and then diffing between the two lists.

###List Renderer
