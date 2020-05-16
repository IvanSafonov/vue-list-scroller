const throttled = function(handler, timeout) {
  if (!timeout) return handler
  let active = false
  let event = null
  return function(e) {
    event = e
    if (active) return
    active = true
    setTimeout(() => {
      handler(event)
      active = false
    }, timeout)
  }
}

export const event = (event, { target, throttle } = {}) => {
  const funcName = `_${event}Handler`
  if (!target) target = window
  return {
    mounted() {
      const handler = throttled(this[event + 'Handler'], throttle)
      this[funcName] = handler
      target.addEventListener(event, handler)
    },
    destroyed() {
      const handler = this[funcName]
      target.removeEventListener(event, handler)
    },
  }
}

export const scroll = event('scroll', { throttle: 17 })
export const resize = event('resize', { throttle: 17 })

export default event
