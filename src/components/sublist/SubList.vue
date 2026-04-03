<template>
  <div class="sublist-div">
    <el-form v-if="sublistState.data" ref="formRef" :size="formProps.size" :inline="formProps.inline" :inline-message="formProps.inlineMessage" :show-message="formProps.showMessage" :model="sublistState.editItem" :rules="props.rules">
      <el-table v-bind="tableProps" :data="sublistState.data">
        <template v-for="column in props.columns" :key="column.prop">
          <el-table-column v-bind="toRaw(column)">
            <template #default="scope">
              <template v-if="sublistState.editing && toRaw(column).type !== 'index'">
                <component
                  :is="editComponentBuilder(scope, sublistState)"
                  v-if="typeof editComponentBuilder(scope, sublistState) !== 'string'"
                />
                <span v-else>{{ getRowColumnValue(scope, column) }}</span>
              </template>
              <span v-else>{{ getRowColumnValue(scope, column) }}</span>
            </template>
          </el-table-column>
        </template>

        <el-table-column v-bind="actionColumnProps" align="center" label="操作">
          <template #default="scope">
            <div class="sublist-actions">
              <template v-if="sublistState.editing && scope.$index === sublistState.editIndex">
                <div>
                  <span class="sublist-confirm sublist-btn" @click="actionConfirm">确认</span>
                  <span class="sublist-split">|</span>
                  <span class="sublist-cancel sublist-btn" @click="actionCancel">取消</span>
                </div>
              </template>
              <template v-else>
                <div>
                  <span
                    :class="`${isReadonly()} sublist-edit sublist-btn`"
                    @click="!sublistState.editing && actionEdit(scope)"
                  >
                    编辑
                  </span>
                  <span :class="`${isReadonly()} `">|</span>
                  <span
                    :class="`${isReadonly()} sublist-delete sublist-btn`"
                    @click="!sublistState.editing && actionRemove(scope.$index)"
                  >
                    删除
                  </span>
                </div>
              </template>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-form>

    <!-- 新增按钮 -->
    <div v-if="!sublistState.editing" class="sublist-add" @click="addData">
      {{ props.addTitle }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch, onMounted, toRaw, computed, h } from 'vue'
import { ElInput, ElTable, ElTableColumn, ElForm, ElFormItem } from 'element-plus'
import type { FormInstance, FormItemRule } from 'element-plus'
import type { TableProps, TableColumn } from 'element-plus'
import type { SubListState } from './type'
import './sublist.css'

defineOptions({
  name: 'SubList'
})

interface Props {
  modelValue: any[]
  columns: TableColumn<any>[]
  model?: { [key: string]: string }
  rules?: Record<string, Array<FormItemRule>>
  tableProps?: Partial<TableProps<any>>
  addTitle?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  model: () => Object.assign({}),
  rules: () => null,
  tableProps: () => ({
    stripe: true,
    border: true,
    size: 'small',
    'empty-text': '没有数据'
  }),
  addTitle: '+ 添加'
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: any[]): void
}>()

/**
 * 深拷贝
 */
const deepCopy = (prototype: any): typeof prototype => {
  return JSON.parse(JSON.stringify(prototype))
}

const sublistState: SubListState<any> = reactive({
  data: props.modelValue ? JSON.parse(JSON.stringify(props.modelValue)) : [],
  editing: false,
  editItem: {},
  editIndex: undefined,
  isNew: false,
  sublistForm: null
})

const formRef = ref<FormInstance>()
onMounted(() => {
  sublistState.sublistForm = formRef.value
})

// 重置状态
const restoreState = () => {
  sublistState.data = props.modelValue ? JSON.parse(JSON.stringify(props.modelValue)) : []
  sublistState.editing = false
  sublistState.editItem = undefined
  sublistState.editIndex = undefined
  sublistState.isNew = false
}

watch(
  () => props.modelValue,
  () => {
    restoreState()
  }
)

// 表单属性
const formProps = computed(() => ({
  size: 'small',
  inline: true,
  inlineMessage: true,
  showMessage: true,
  rules: props.rules,
  model: sublistState.editItem
}))

// 表格属性
const tableProps = computed(() => deepCopy(props.tableProps))

// 操作列属性
const actionColumnProps = computed(() => ({
  align: 'center',
  label: '操作'
}))

/**
 * 添加数据项并进行编辑
 */
const addData = (): void => {
  sublistState.data.push(deepCopy(props.model))
  sublistState.editIndex = sublistState.data.length - 1
  sublistState.editing = true
  sublistState.editItem = deepCopy(deepCopy(props.model))
  sublistState.isNew = true
}

// 编辑
const actionEdit = (scope: any): void => {
  sublistState.editIndex = scope.$index
  sublistState.editing = true
  sublistState.editItem = deepCopy(scope.row)
}

// 移除
const actionRemove = (index: number): void => {
  sublistState.data?.splice(index, 1)
  emit('update:modelValue', sublistState.data)
}

// 确认
const actionConfirm = () => {
  sublistState.sublistForm?.validate((valid: boolean): void | boolean => {
    if (valid) {
      if (typeof sublistState.editIndex === 'number') {
        sublistState.data.splice(sublistState.editIndex, 1, deepCopy(toRaw(sublistState.editItem)))
      }
      sublistState.editIndex = undefined
      sublistState.editItem = undefined
      sublistState.editing = false
      emit('update:modelValue', sublistState.data)
    } else {
      return false
    }
  })
}

// 取消
const actionCancel = () => {
  if (sublistState.isNew) {
    sublistState.data.splice(sublistState.data.length - 1, 1)
  }
  sublistState.editItem = undefined
  sublistState.editing = false
  sublistState.editIndex = undefined
}

// 获取只读状态
const isReadonly = (): string => {
  return sublistState.editing ? 'readonly' : ''
}

// 获取行列值
const getRowColumnValue = (scope: any, column: any) => {
  const cellValue = scope.row[scope.column.property]
  return scope.column.formatter
    ? scope.column.formatter(scope.row, scope.column, cellValue, scope.$index)
    : cellValue
}

// 编辑组件构建器
const editComponentBuilder = (scope: any, state: SubListState<any>): any => {
  const rawColumn = toRaw(scope.column)
  if (!rawColumn.editComponent) {
    // 默认编辑组件
    return h(
      ElFormItem,
      {
        size: 'small',
        class: 'sublist-form-item',
        label: rawColumn.name,
        prop: rawColumn.property
      },
      () =>
        h(ElInput, {
          label: rawColumn.label,
          size: 'small',
          'onUpdate:modelValue': (val: any) => {
            state.editItem[rawColumn.property] = val
          },
          modelValue: state.editItem[rawColumn.property]
        })
    )
  }
  return rawColumn.editComponent(scope, state)
}
</script>
