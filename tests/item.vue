<template>
  <div>{{ index + ' ' + data.text }}</div>
</template>

<script>
export default {
  props: {
    data: Object,
    index: Number,
  },
  methods: {
    resized() {},
  },
}
</script>
