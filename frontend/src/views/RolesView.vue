<script setup lang="ts">
import RoleGraph from '@/components/RoleGraph.vue'
</script>

<template>
  <div class="roles-view">
    <RoleGraph />
  </div>
</template>

<style scoped>
.roles-view {
  width: 100%;
  height: calc(100vh - 100px); /* Adjust based on header height */
}
</style>
