import ListScroller from '@/listscroller'
import { mount } from '@vue/test-utils'
import Item from './item'
import ResizeObserver from './resizeobserver'
jest.mock('./resizeobserver')

const updateSizes = (expectedItems, clear = true) => {
  expect(ResizeObserver).toBeCalledTimes(1)
  const { observe } = ResizeObserver.mock.instances[0]
  expect(observe).toBeCalledTimes(expectedItems)

  ResizeObserver.mock.calls[0][0](
    observe.mock.calls.map(v => {
      return { target: v[0] }
    }),
  )
  if (clear) observe.mockClear()
}

const itemsData = []
for (let i = 0; i < 1000; i++) itemsData[i] = { text: String(i) }

describe('ListScroller component', () => {
  const handler = {}

  beforeEach(() => {
    window.ResizeObserver = ResizeObserver
    ResizeObserver.mockClear()

    window.addEventListener = jest.fn((event, func) => (handler[event] = func))
    jest.useFakeTimers()
    window.innerHeight = 70
  })

  describe('with 1000 items', () => {
    let wrapper, height, bounds, spacerBounds
    const setItemBounds = (index, bounds) => {
      const el = wrapper.findAll(Item).at(index).vm.$el
      el.getBoundingClientRect = jest.fn(() => {
        return bounds
      })
    }

    beforeEach(() => {
      jest.useFakeTimers()
      window.innerHeight = 70
      window.innerWidth = 50
      height = 20
      wrapper = mount(ListScroller, {
        propsData: {
          itemComponent: Item,
          itemsData,
          itemHeight: 20,
        },
        methods: { getItemHeight: jest.fn(() => height) },
      })

      bounds = { bottom: 0 }
      wrapper.vm.$refs.list.getBoundingClientRect = jest.fn(() => bounds)

      spacerBounds = { bottom: 0 }
      wrapper.vm.$refs.spacer.getBoundingClientRect = jest.fn(
        () => spacerBounds,
      )
    })

    it('renders first items according to itemHeight', () => {
      const items = wrapper.findAll(Item)
      expect(items.length).toBe(12)
      expect(wrapper.element).toMatchSnapshot()
    })

    it('passes data and index to item component', () => {
      const item10 = wrapper.findAll(Item).at(10).vm
      expect(item10.data).toEqual({ text: '10' })
      expect(item10.index).toEqual(10)
    })

    it('registers items in resize observer', async () => {
      expect(ResizeObserver).toBeCalledTimes(1)
      const { observe, unobserve } = ResizeObserver.mock.instances[0]
      expect(observe).toBeCalledTimes(12)
      expect(unobserve).toBeCalledTimes(0)
      const item0 = wrapper.findAll(Item).at(0).vm
      expect(item0.index).toEqual(0)
      const item7 = wrapper.findAll(Item).at(7).vm
      expect(item7.index).toEqual(7)
      expect(observe).toBeCalledWith(item0.$el)
      expect(observe).toBeCalledWith(item7.$el)

      // scroll down
      observe.mockClear()
      unobserve.mockClear()
      bounds.top = -170
      handler.scroll()
      jest.runAllTimers()
      await wrapper.vm.$nextTick()

      expect(unobserve).toBeCalledTimes(8)
      expect(unobserve).toBeCalledWith(item0.$el)
      expect(unobserve).toBeCalledWith(item7.$el)

      expect(observe).toBeCalledTimes(8)
      const item12 = wrapper.findAll(Item).at(4).vm
      expect(item12.index).toEqual(12)
      const item19 = wrapper.findAll(Item).at(11).vm
      expect(item19.index).toEqual(19)
      const item16 = wrapper.findAll(Item).at(8).vm
      expect(item16.index).toEqual(16)
      expect(observe).toBeCalledWith(item12.$el)
      expect(observe).toBeCalledWith(item16.$el)
      expect(observe).toBeCalledWith(item19.$el)

      // scroll up
      observe.mockClear()
      unobserve.mockClear()
      bounds.top = -140
      handler.scroll()
      jest.runAllTimers()
      await wrapper.vm.$nextTick()
      expect(unobserve).toBeCalledTimes(5)
      expect(unobserve).toBeCalledWith(item16.$el)
      expect(unobserve).toBeCalledWith(item19.$el)
      expect(observe).toBeCalledTimes(5)
      const item3 = wrapper.findAll(Item).at(0).vm
      expect(item3.index).toEqual(3)
      expect(observe).toBeCalledWith(item3.$el)
    })

    it('uses khown heights on slow scrolling', async () => {
      // down by 130
      bounds.top = -130
      handler.scroll()
      jest.runAllTimers()
      await wrapper.vm.$nextTick()
      expect(wrapper.element).toMatchSnapshot()

      // down by 70
      bounds.top = -200
      handler.scroll()
      jest.runAllTimers()
      await wrapper.vm.$nextTick()
      expect(wrapper.element).toMatchSnapshot()

      // up by 100
      bounds.top = -100
      handler.scroll()
      jest.runAllTimers()
      await wrapper.vm.$nextTick()
      expect(wrapper.element).toMatchSnapshot()
    })

    it('uses approximate heights on fast scrolling', async () => {
      // down by 2000
      bounds.top = -2000
      handler.scroll()
      jest.runAllTimers()
      await wrapper.vm.$nextTick()
      expect(wrapper.element).toMatchSnapshot()
    })

    it('corrects spacer margin on scrolling up', async () => {
      updateSizes(12)
      await wrapper.vm.$nextTick()

      // down by 2000
      bounds.top = -2000
      handler.scroll()
      jest.runAllTimers()
      await wrapper.vm.$nextTick()

      updateSizes(12)
      await wrapper.vm.$nextTick()

      // up by 100
      height = 15
      bounds.top = -1930
      handler.scroll()
      jest.runAllTimers()
      await wrapper.vm.$nextTick()
      setItemBounds(7, { top: 200 }) // 8th item top is visible
      updateSizes(8)

      await wrapper.vm.$nextTick()
      expect(wrapper.element).toMatchSnapshot()
    })

    it('corrects spacer margin if its too big at start', async () => {
      window.scroll = jest.fn()
      window.scrollY = 100

      // down by 130
      bounds.top = -130
      handler.scroll()
      jest.runAllTimers()
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.spacerMargin).toBe(40)
      wrapper.vm.spacerMargin = 100

      // up back to 0
      bounds.top = 0
      handler.scroll()
      jest.runAllTimers()
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.spacerMargin).toBe(0)
      expect(window.scroll).toBeCalledWith(0, 40)
    })

    it('corrects spacer margin, rough', async () => {
      updateSizes(12)
      window.scroll = jest.fn()
      window.scrollY = 100

      // down by 10000
      bounds.top = -10000
      handler.scroll()
      jest.runAllTimers()
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.spacerMargin).toBe(10000)

      // resize, height gets bigger
      window.innerWidth = 65
      height = 30
      handler.resize()
      jest.runAllTimers()
      await wrapper.vm.$nextTick()
      updateSizes(12, false)

      await wrapper.vm.$nextTick()
      expect(wrapper.vm.spacerMargin).toBe(15000)
      expect(window.scroll).toBeCalledWith(0, 5220)
    })

    it('corrects space margin if its neganive', async () => {
      window.scroll = jest.fn()
      window.scrollY = 100

      // down by 130
      bounds.top = -130
      handler.scroll()
      jest.runAllTimers()
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.spacerMargin).toBe(40)
      wrapper.vm.spacerMargin = 0

      // up to 40
      bounds.top = -40
      handler.scroll()
      jest.runAllTimers()
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.spacerMargin).toBe(0)
      expect(window.scroll).toBeCalledWith(0, 140)
    })

    it('corrects height if spacer overflows', async () => {
      expect(wrapper.vm.height).toBe(20000)
      bounds.bottom = 324
      spacerBounds.bottom = 329
      handler.scroll()
      jest.runAllTimers()
      await wrapper.vm.$nextTick()
      updateSizes(12)
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.height).toBe(20005)
    })

    it('corrects height if spacer shorter at the end', async () => {
      expect(wrapper.vm.height).toBe(20000)
      bounds.bottom = 350
      bounds.top = -19990
      spacerBounds.bottom = 330
      handler.scroll()
      jest.runAllTimers()
      await wrapper.vm.$nextTick()
      updateSizes(13)
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.height).toBe(19980)
    })

    it('handles horisontal resize', async () => {
      updateSizes(12)
      bounds.top = -3000
      handler.scroll()
      jest.runAllTimers()
      await wrapper.vm.$nextTick()

      window.innerWidth = 65
      height = 30
      handler.resize()
      jest.runAllTimers()
      await wrapper.vm.$nextTick()
      updateSizes(12)
      await wrapper.vm.$nextTick()
      expect(wrapper.element).toMatchSnapshot()
    })

    it('handles vertical resize', async () => {
      bounds.top = -3000
      handler.scroll()
      jest.runAllTimers()
      await wrapper.vm.$nextTick()

      height = 30
      handler.resize()
      jest.runAllTimers()
      await wrapper.vm.$nextTick()
      expect(wrapper.element).toMatchSnapshot()
    })

    it('emits bottom event after rendering last item', async () => {
      updateSizes(12)
      bounds.top = -19700
      handler.scroll()
      jest.runAllTimers()
      await wrapper.vm.$nextTick()
      expect(wrapper.emitted('bottom')).toBeFalsy()

      bounds.top = -19850
      handler.scroll()
      jest.runAllTimers()
      await wrapper.vm.$nextTick()
      updateSizes(15)
      expect(wrapper.emitted('bottom').length).toBe(1)
    })

    it('updates if itemesData changed', async () => {
      wrapper.setProps({ itemsData: itemsData.slice(0, 100) })
      jest.runAllTimers()
      await wrapper.vm.$nextTick()
      expect(wrapper.element).toMatchSnapshot()
    })
  })

  describe('with smaller real item height', () => {
    let wrapper
    beforeEach(() => {
      wrapper = mount(ListScroller, {
        propsData: {
          itemComponent: Item,
          itemsData,
          itemHeight: 40,
        },
        methods: { getItemHeight: jest.fn(() => 30) },
      })
    })

    it('updates sizes after rendering', async () => {
      updateSizes(6)
      await wrapper.vm.$nextTick()
      const items = wrapper.findAll(Item)
      expect(items.length).toBe(9)
      expect(wrapper.element).toMatchSnapshot()
    })
  })

  describe('with two items', () => {
    let wrapper
    beforeEach(() => {
      wrapper = mount(ListScroller, {
        propsData: {
          itemComponent: Item,
          itemsData: [{ text: '1' }, { text: '2' }],
          itemHeight: 30,
        },
        methods: { getItemHeight: jest.fn(() => 30) },
      })
    })

    it('renders correctly', () => {
      const items = wrapper.findAll(Item)
      expect(items.length).toBe(2)
      expect(wrapper.element).toMatchSnapshot()
    })
  })

  it('gets item height from dom', () => {
    const wrapper = mount(ListScroller, {
      propsData: {
        itemComponent: Item,
        itemsData,
        itemHeight: 20,
      },
      methods: { updateHeights: jest.fn() },
    })

    const setBottom = (index, bottom) => {
      const el = wrapper.findAll(Item).at(index).vm.$el
      el.getBoundingClientRect = jest.fn(() => {
        return { bottom }
      })
    }

    // first item uses ListScroller top
    wrapper.vm.$refs.list.getBoundingClientRect = jest.fn(() => {
      return { top: -100 }
    })
    setBottom(0, -60)
    expect(wrapper.vm.getItemHeight(0)).toBe(40)

    // other items use bottom of previous item
    setBottom(1, 10)
    expect(wrapper.vm.getItemHeight(1)).toBe(70)

    // pays respect to the items margin
    setBottom(0, 1160)
    wrapper.vm.spacerMargin = 1100
    wrapper.vm.start = 100
    expect(wrapper.vm.getItemHeight(100)).toBe(160)
  })
})
