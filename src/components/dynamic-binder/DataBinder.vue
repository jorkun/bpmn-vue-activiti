<template>
  <component
    :is="Component"
    :key="`field-binder-${bindKey}`"
    v-model="bindValue"
    v-bind="fieldDefine"
    :class="`${Component.name}-${bindKey} dynamic-binder-item`"
  >
    <template v-for="(_, name) in fieldDefine.vSlots" :key="name" #[name]="slotData">
      <component :is="fieldDefine.vSlots[name]" v-bind="slotData" />
    </template>
  </component>
</template>

<script setup lang="ts">
import { ref, watch, toRaw } from 'vue'
import type { FieldDefine } from '@/components/dynamic-binder/index'

defineOptions({
  name: 'DataBinder'
})

interface Props {
  modelValue: any
  bindKey: string
  fieldDefine: FieldDefine
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void
  (e: 'fieldChange', key: string, value: any): void
}>()

const fieldDefine = toRaw(props.fieldDefine)
const Component = toRaw(fieldDefine.component) as any
const bindValue = ref(props.modelValue ? props.modelValue : null)

watch(
  () => bindValue.value,
  (newValue) => {
    emit('update:modelValue', newValue)
  }
)
</script>
