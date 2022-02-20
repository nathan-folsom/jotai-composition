# Composition in Reusable Components with Jotai
In this article I'm going to be showing a design pattern for maximizing composition in reusable React components
using the state management library Jotai. If you're not familiar with Jotai [check it out](https://jotai.org/), or keep 
reading; its not too complicated!

I'm using the example of a universal picker component that renders a list of items, and allows the user to select
some items. Here is a very minimal example that implements the most basic functionality. Some type definitions and
styling have been omitted, [visit the GitHub repository](https://github.com/nathan-folsom/jotai-composition)
to see all of the code.

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

