# Composition in Reusable Components with Jotai
In this article I'm going to be showing a design pattern for maximizing composition in reusable React components
using the state management library Jotai. If you're not familiar with Jotai [check it out](https://jotai.org/), or keep 
reading; its not too complicated!

I'm using the example of a universal picker component that renders a list of items, and allows the user to make a selection
of a certain subset of the list. 
