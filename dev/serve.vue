<template>
  <div>
    <div class="box"></div>
    <list-scroller
      :itemComponent="item"
      :itemsData="items"
      :itemHeight="350"
      :renderViewports="5"
      class="list"
      @bottom="addMore"
    />
    <div class="box"></div>
  </div>
</template>

<script>
import ListScroller from '@/listscroller'
import Item from './item'

const lorem =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ' +
  'Phasellus mattis at neque eu venenatis. Nam et sodales purus. ' +
  'Suspendisse pulvinar nisl purus, vel consequat neque varius vel. ' +
  'Ut ut consequat lorem. Nulla odio arcu, porta eu fringilla id, ' +
  'porta eget massa. Vivamus porta pulvinar ex, vel egestas erat ' +
  'rutrum vitae. Cras at felis malesuada, lacinia nulla non, ' +
  'tincidunt ligula. Sed facilisis mauris et metus commodo, ' +
  'sit amet porttitor mi efficitur. Cras et accumsan eros. Ut ' +
  'facilisis venenatis quam a luctus. Nam egestas dignissim viverra. ' +
  'Curabitur volutpat, enim et luctus faucibus, ex nisl ultrices est, ' +
  'in faucibus sapien libero vel arcu. Nullam placerat, mauris id ' +
  'vestibulum sollicitudin, lacus leo finibus mauris, nec efficitur ' +
  'neque ex sit amet arcu'

export default {
  components: { ListScroller },
  data() {
    return {
      items: [],
      item: Item,
    }
  },
  methods: {
    addMore() {
      if (this.items.length > 10000) return

      for (let i = 0; i < 30; i++) {
        this.items.push({
          text: lorem.slice(0, 200 + Math.floor(Math.random() * 500)) + ' ...',
          img: Math.floor(Math.random() * 1000),
        })
      }
    },
  },
  created() {
    this.addMore()
  },
}
</script>

<style lang="scss" scoped>
.box {
  height: 10rem;
  border: solid;
  border-width: 1px;
}
.list {
  margin-bottom: 1.1em;
}
</style>
