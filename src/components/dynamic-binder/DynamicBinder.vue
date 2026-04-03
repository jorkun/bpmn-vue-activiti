<template>
  <div class="dynamic-binder">
    <template v-for="(define, key) in flatFieldDefine" :key="key">
      <DataBinder
        v-if="predicate(define, rawModelValue)"
        :bind-key="key"
        :field-define="define"
        v-model="bindDataMap[key].value"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, toRaw, watch } from 'vue'
import ScriptHelper, { resolve } from '../../utils/script-helper'
import DataBinder from './DataBinder.vue'
import type { FieldDefine } from '@/components/dynamic-binder/index'
import type { PropertiesMap } from '@/bpmn/config'

defineOptions({
  name: 'DynamicBinder'
})

interface Props {
  modelValue: unknown
  fieldDefineProps: PropertiesMap<FieldDefine>
  bindTransformer?: Function
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: unknown): void
  (e: 'fieldChange', key: string, value: unknown): void
}>()

const flatFieldDefine = flatObject(props.fieldDefineProps)
const rawModelValue = toRaw(props.modelValue)
const bindDataMap: PropertiesMap<any> = {}

Object.keys(flatFieldDefine).forEach((key) => {
  const define = flatFieldDefine[key]
  const valueRef = ref(
    define.getValue ? define.getValue(rawModelValue) : resolve(key, props.modelValue) || ''
  )
  bindDataMap[key] = valueRef

  watch(
    () => valueRef.value,
    () => {
      if (define.setValue) {
        const setValueCallBack = define.setValue(rawModelValue, key, valueRef.value)
        if (setValueCallBack) {
          setValueCallBack()
        }
      } else {
        emit('fieldChange', key, valueRef.value)
      }
    }
  )
})

/**
 * 将对象结构扁平化
 * 例如：
 * const obj = {
 *   a: {
 *     b: {
 *       c: 'xxx',
 *     },
 *   },
 * };
 * 出来的对象会变成，{a.b.c:'xxx'}
 */
function flatObject(source: PropertiesMap<FieldDefine>, prefix = ''): FieldDefine {
  const result: FieldDefine = {}
  Object.keys(source).forEach((key) => {
    const currentKeyObj = source[key]
    if (!currentKeyObj || !(typeof currentKeyObj === 'object')) {
      return
    }
    const component = currentKeyObj.component
    if (component) {
      result[prefix + key] = currentKeyObj
    } else {
      flatObject(currentKeyObj, `${key}.`)
    }
  })
  return result
}

/**
 * 断言
 * 若对象中有predicate断言属性，则执行断言 返回true/false
 * 1.若属性为string,则使用脚本处理器执行，如 predicate='obj.a ===1' 则会传入当前对象进行判断；
 * 2.若属性为function，则直接传入目标对象直接执行
 */
function predicate(fieldDefine: FieldDefine, modelValue: unknown): boolean {
  const bindDefinePredicate = fieldDefine.predicate
  if (bindDefinePredicate) {
    if (typeof bindDefinePredicate === 'string') {
      return ScriptHelper.executeEl(modelValue, bindDefinePredicate) as boolean
    }

    if (typeof bindDefinePredicate === 'function') {
      return bindDefinePredicate(modelValue)
    }
  }
  return true
}
</script>
