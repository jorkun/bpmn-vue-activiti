<template>
  <div class="prefix-label-select-container">
    <div v-if="prefixTitle" class="prefix-title">{{ prefixTitle }}</div>
    <el-autocomplete
      class="prefix-label-select"
      :model-value="modelValue"
      @update:model-value="handleUpdate"
      v-bind="$attrs"
    >
      <template v-for="(_, name) in $slots" #[name]="slotData">
        <slot :name="name" v-bind="slotData" />
      </template>
    </el-autocomplete>
  </div>
</template>

<script setup lang="ts">
import { ElAutocomplete } from 'element-plus'
import '../prefix-label-select/prefix-label-select.css'

defineOptions({
  name: 'PrefixAutoComplete',
  inheritAttrs: false
})

interface Props {
  modelValue?: any
  prefixTitle?: string
}

const props = withDefaults(defineProps<Props>(), {
  prefixTitle: ''
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void
}>()

const handleUpdate = (value: any) => {
  emit('update:modelValue', value)
}
</script>
