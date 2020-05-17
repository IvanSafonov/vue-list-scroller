![Node.js CI](https://github.com/IvanSafonov/vue-list-scroller/workflows/Node.js%20CI/badge.svg)

# vue-list-scroller

It can help with creating Twitter-like feed with thousands of items. It renders only visible part of the list.

## Notes

* Only page mode
* Uses ResizeObserver
* Items can have any size and change dynamically
* Items can have margins
* Supports infinite scroll

# Usage

Add package to your project

```bash
npm install vue-list-scroller --save
```

Create item component
```vue
<template>
  <div>{{ 'Item ' + index + ' ' + data.text }}</div>
</template>

<script>
export default {
  props: {
    data: Object,
    index: Number,
  },
}
</script>
```

Add ListScroller component to your project

```vue
<template>
  <div>
    <list-scroller :itemComponent="item" :itemsData="items" :itemHeight="350" />
  </div>
</template>

<script>
import ListScroller from 'vue-list-scroller'
import Item from './item'

export default {
  components: { ListScroller },
  data() {
    return {
      items: [{ text: 'first' }, { text: 'second' }],
      item: Item,
    }
  },
}
</script>
```

# Example

You can clone this project and start example with these commands. It's in the dev folder.

```bash
npm install
npm run serve
```

# Props

* `itemsData`: array of the data that is passed to items
* `itemHeight`: approximate item height in pixels. it's used only at first rendering
* `itemComponent`: vue js item component
* `renderViewports`: height of the rendered part relative to viewport height. For example, if it's set to 5 and window inner height is 400, it will render 800 pixels before and after visible part of the list

# Events

* `bottom`: emits when the last item is rendered. Used for infinite scroll


# Similar projects

* [vue-virtual-scroll-list](https://github.com/tangbc/vue-virtual-scroll-list)
* [vue-virtual-scroller](https://github.com/Akryum/vue-virtual-scroller)

