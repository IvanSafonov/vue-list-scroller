<template>
  <div ref="list" :style="listStyle">
    <div ref="spacer" :style="spacerStyle">
      <component
        v-for="item in visibleItems"
        :key="item.index"
        :is="itemComponent"
        :data-item-index="item.index"
        :data="item.data"
        :index="item.index"
      />
    </div>
  </div>
</template>

<script>
import { scroll, resize } from '@/mixins'
import { pxEq, pxGt } from '@/utils'

export default {
  mixins: [scroll, resize],
  props: {
    // Array of data that is passed to item
    itemsData: { type: Array, required: true },
    // Approximate item height (used at first render)
    itemHeight: { type: Number, required: true },
    // Vue js item component
    itemComponent: { type: [Object, Function], required: true },
    // Height of rendered part relative to viewport height
    renderViewports: { type: Number, default: 3 },
    // The name of the item component function that is called on item resize
    onItemResize: String,
  },

  data() {
    return {
      start: 0, // index of the first rendered item
      end: 0, // index of the last rendered item (not included)
      height: 0, // average item height
      spacerMargin: 0, // margin before spacer element
    }
  },

  computed: {
    visibleItems() {
      return this.itemsData.slice(this.start, this.end).map((v, i) => {
        return { data: v, index: this.start + i }
      })
    },

    spacerStyle() {
      return {
        transform: 'translateY(' + this.spacerMargin + 'px)',
      }
    },

    listStyle() {
      return {
        height: this.height + 'px',
        position: 'relative',
        overflow: 'hidden',
        overflowAnchor: 'none', // onItemsResize does this
      }
    },
  },

  methods: {
    /**
     * Scroll event handler
     * Checks scrolled distance. If the distance is within rendered items,
     * it will change start and spacerMargin according to known (or average)
     * items sizes.
     * If the scrolled distance is bigger, it will change start
     * and spacerMargin to approximate values using average item height
     */
    scrollHandler() {
      const prevScrollTop = this.scrollTop
      this.scrollTop = Math.max(0, -this.$refs.list.getBoundingClientRect().top)
      const diff = this.scrollTop - prevScrollTop
      const preRendered = Math.ceil(
        (Math.ceil(window.innerHeight / this.average) *
          (this.renderViewports - 1)) /
          2,
      )

      const height = (index) => this.heights.get(index) || this.average
      const heights = (index, down = false) => {
        let res = 0
        const max = index + preRendered + (down ? 1 : 0)
        for (let i = index; i < max; i++) res += height(i)
        return res
      }

      if (Math.abs(diff) < 0.65 * window.innerHeight * this.renderViewports) {
        let { spacerMargin, start } = this
        if (diff > 0) {
          while (spacerMargin + heights(start, true) < this.scrollTop) {
            spacerMargin += height(start)
            start++
          }
        } else {
          while (start > 0 && spacerMargin + heights(start) > this.scrollTop) {
            start--
            spacerMargin -= height(start)
          }
        }
        this.spacerMargin = spacerMargin
        this.setStart(start)
      } else {
        const start = Math.floor(this.scrollTop / this.average)
        this.spacerMargin = start * this.average
        this.setStart(start)
      }
    },

    /**
     * Resize event handler
     * Clears known items' heights if window width changes
     * Keeps visible heights
     */
    resizeHandler() {
      if (!pxEq(this.prevWidth, this.width())) {
        const old = this.heights
        this.heights = new Map()
        for (let i = this.start; i < this.end; i++)
          if (old.has(i)) this.heights.set(i, old.get(i))
      }
    },

    /**
     * Getting real item height from dom
     * Uses the distance between bottoms of current and previous items.
     * If it's the first rendered item, uses top of the list element
     * It allows to use items with margins
     */
    getItemHeight(index) {
      const { spacer } = this.$refs
      index -= this.start
      const prev =
        index === 0
          ? this.$refs.list.getBoundingClientRect().top + this.spacerMargin
          : spacer.children[index - 1].getBoundingClientRect().bottom
      return spacer.children[index].getBoundingClientRect().bottom - prev
    },

    /**
     * Returns true if item's top is invisible
     * Used to check if it needs to correct spacerMargin when actual size
     * of items changes.
     */
    isTopItem(index) {
      const { spacer } = this.$refs
      return spacer.children[index - this.start].getBoundingClientRect().top > 0
    },

    /**
     * ResizeObserver handler
     * Updates average items' height and corrects spacerMargin
     */
    onItemsResize(entities) {
      if (this.isDeactivated) return
      let { average } = this
      average *= this.heights.size
      let changed = false
      let spacerMargin = 0

      entities.forEach((entity) => {
        const el = entity.target
        const idx = Number(el.dataset.itemIndex)

        if (idx >= this.start && idx < this.end) {
          const prevHeight = this.heights.get(idx)
          const newHeight = this.getItemHeight(idx)
          if (!pxEq(prevHeight, newHeight)) {
            if (!this.isTopItem(idx))
              spacerMargin += newHeight - (prevHeight || this.average)

            average += newHeight - (prevHeight || 0)
            this.heights.set(idx, newHeight)
            changed = true
          }
          if (this.onItemResize) el.__vue__[this.onItemResize]()
        }
      })

      if (changed) {
        this.average = average / this.heights.size
        this.spacerMargin -= spacerMargin
        this.setStart(this.start)
      }

      this.$nextTick(() => {
        this.fixSpacerMargin()
        this.fixHeight()
      })
    },

    observe(from, to) {
      this.$nextTick(() => {
        for (let i = from; i < to; i++)
          this.observer.observe(this.$refs.spacer.children[i])
      })
    },

    unobserve(from, to) {
      for (let i = from; i < to; i++)
        this.observer.unobserve(this.$refs.spacer.children[i])
    },

    /**
     * Sets a new start index
     * Calculates end index and updates observed items in ResizeObserver
     */
    setStart(index) {
      this.prevWidth = this.width()
      const count = Math.round(
        this.renderViewports * Math.ceil(window.innerHeight / this.average),
      )
      const { start: prevStart, end: prevEnd } = this
      this.start = Math.max(index, 0)
      this.end = Math.min(this.start + count, this.itemsData.length)
      if (prevStart === this.start && prevEnd === this.end) return

      if (this.start != prevStart || this.end != prevEnd)
        this.unobserve(0, Math.min(this.start, prevEnd) - prevStart)
      if (prevEnd > this.end)
        this.unobserve(
          Math.max(this.end, prevStart) - prevStart,
          prevEnd - prevStart,
        )

      if (this.start < prevStart)
        this.observe(0, Math.min(prevStart, this.end) - this.start)
      if (prevEnd < this.end)
        this.observe(
          Math.max(prevEnd, this.start) - this.start,
          this.end - this.start,
        )

      const bottom = this.itemsData.length === this.end
      if (bottom && !this.bottom) this.$emit('bottom')
      this.bottom = bottom
    },

    /**
     * Fixes spacerMargin errors
     */
    fixSpacerMargin() {
      if (this.start === 0) {
        if (pxEq(this.spacerMargin, 0)) return
        window.scroll(0, window.scrollY - this.spacerMargin)
        this.spacerMargin = 0
      } else if (pxGt(0, this.spacerMargin)) {
        const avMargin = this.spacerMargin - this.average * this.start
        this.spacerMargin -= avMargin
        window.scroll(0, window.scrollY - avMargin)
      }
    },

    /**
     * Fixes height error
     */
    fixHeight() {
      const { list, spacer } = this.$refs
      const diff =
        spacer.getBoundingClientRect().bottom -
        list.getBoundingClientRect().bottom

      if (this.itemsData.length == this.end) {
        if (pxEq(diff, 0)) return
        this.height += diff
      } else if (pxGt(diff, 0)) {
        this.height = Math.max(
          this.height + diff,
          this.average * this.itemsData.length,
        )
      } else if (
        Math.abs(this.height - this.average * this.itemsData.length) >
        0.1 * this.itemsData.length * this.average
      ) {
        this.height = this.average * this.itemsData.length
      }
    },

    width() {
      const { list } = this.$refs
      return list ? list.getBoundingClientRect().width : 0
    },
  },

  watch: {
    itemsData() {
      this.setStart(this.start)
    },
  },

  created() {
    this.heights = new Map()
    this.scrollTop = 0
    this.average = this.itemHeight
    this.observer = new ResizeObserver(this.onItemsResize)
    this.setStart(0)
  },

  beforeDestroy() {
    this.observer.disconnect()
  },

  activated() {
    this.isDeactivated = false
  },

  deactivated() {
    this.isDeactivated = true
  },
}
</script>
