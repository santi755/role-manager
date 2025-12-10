<script setup lang="ts">
import { RouterView, RouterLink } from 'vue-router'
</script>

<template>
  <div id="app">
    <nav class="main-nav">
      <div class="nav-brand">Role Manager</div>
      <div class="nav-links">
        <RouterLink to="/roles" class="nav-link">Roles Graph</RouterLink>
        <RouterLink to="/permissions" class="nav-link">Permissions</RouterLink>
        <RouterLink to="/users" class="nav-link">Users</RouterLink>
        <RouterLink to="/user-permissions" class="nav-link">User Permissions</RouterLink>
      </div>
    </nav>
    
    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
#app {
  font-family: 'Inter', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: var(--color-text-primary);
  background-color: var(--color-background);
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4) var(--space-8);
  background-color: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
}

.nav-brand {
  font-weight: 700;
  font-size: var(--font-size-xl);
  color: var(--color-text-primary);
}

.nav-links {
  display: flex;
  gap: var(--space-8);
}

.nav-link {
  text-decoration: none;
  color: var(--color-text-secondary);
  font-weight: 500;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  transition: all 0.2s;
}

.nav-link:hover {
  color: var(--color-text-primary);
  background-color: var(--color-surface-hover);
}

.nav-link.router-link-active {
  color: var(--color-primary);
  background-color: rgba(59, 130, 246, 0.1);
}

.main-content {
  flex: 1;
  overflow: hidden;
  background-color: var(--color-background);
}
</style>
