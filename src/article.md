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

###Composition
