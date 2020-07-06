const throttled = function (handler, timeout) {
  if (!timeout) return handler
  let active = false
  let event = null
  return function (e) {
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
  const deactivatedName = `_${event}Deactivated`
  if (!target) target = window
  return {
    mounted() {
      this[funcName] = throttled(this[event + 'Handler'], throttle)
      target.addEventListener(event, this[funcName])
    },
    destroyed() {
      target.removeEventListener(event, this[funcName])
    },
    activated() {
      if (!this[deactivatedName]) return
      target.addEventListener(event, this[funcName])
      this[deactivatedName] = false
    },
    deactivated() {
      target.removeEventListener(event, this[funcName])
      this[deactivatedName] = true
    },
  }
}

export const scroll = event('scroll', { throttle: 17 })
export const resize = event('resize', { throttle: 17 })

export default event
