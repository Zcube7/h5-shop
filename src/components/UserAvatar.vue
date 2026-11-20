<script setup>
import { computed } from 'vue'

const props = defineProps({
  name: { type: String, default: '' },
  color: { type: String, default: '#ff6034' },
  size: { type: Number, default: 56 },
})
const initial = computed(() => Array.from(props.name.trim())[0] || '?')
</script>

<template>
  <div
    class="avatar"
    :style="{ width: `${size}px`, height: `${size}px`, fontSize: `${size * 0.42}px`, background: color }"
  >
    {{ initial }}
  </div>
</template>

<style scoped>
.avatar {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 600;
  border: 2px solid rgba(255, 255, 255, 0.85);
  border-radius: 50%;
}
</style>
