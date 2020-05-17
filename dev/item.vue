<template>
  <div class="item">
    <img :src="imgUrl" />
    <div>
      <h2>
        <b>Item {{ index }}</b>
      </h2>
      {{ ' ' + data.text }}
    </div>
  </div>
</template>

<script>
export default {
  props: {
    data: Object,
    index: Number,
  },
  computed: {
    imgUrl() {
      return `https://picsum.photos/id/${this.data.img}/500/200`
    },
  },
}
</script>

<style lang="scss" scoped>
.item {
  margin: 1.1em;
  padding: 1em;
  border: solid;
  border-width: 3px;
  img {
    width: 100%;
    max-height: 200px;
    object-fit: contain;
  }
}
</style>
