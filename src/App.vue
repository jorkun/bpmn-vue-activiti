<template>
  <div class="app-containers">
    <Modeler />
    <Panel />
    <BpmnActions />
  </div>
</template>

<script setup lang="ts">
import Modeler from './components/modeler/index.vue'
import Panel from './components/panel/index.vue'
import BpmnActions from './components/bpmn-actions/index.vue'
import './index.css'
</script>
