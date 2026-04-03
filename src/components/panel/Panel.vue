<template>
  <template v-if="contextState.businessObject && contextState.activeBindDefine">
    <div
      class="bpmn-panel-shrinkage"
      @click="panelState.shrinkageOff = !panelState.shrinkageOff"
    >
      <i v-if="panelState.shrinkageOff" class="el-icon-s-fold" />
      <i v-else class="el-icon-s-unfold" />
    </div>

    <div v-show="!panelState.shrinkageOff" class="bpmn-panel">
      <div class="title">{{ bpmnContext.getActiveElementName() }}</div>

      <el-collapse class="bpmn-panel-collapse" v-model="panelState.elCollapses">
        <el-collapse-item
          v-for="groupItem in contextState.activeBindDefine"
          :key="groupItem.name"
          :name="groupItem.name"
        >
          <template #title>
            <div class="group-title-block">
              <i v-if="groupItem.icon" :class="groupItem.icon" />
              {{ groupItem.name }}
            </div>
          </template>

          <DynamicBinder
            :field-define-props="groupItem.properties"
            v-model="contextState.businessObject"
            @field-change="onFieldChange"
          />
        </el-collapse-item>
      </el-collapse>
    </div>
  </template>
</template>

<script setup lang="ts">
import { reactive, watch, isRef } from 'vue'
import { ElCollapse, ElCollapseItem } from 'element-plus'
import { BpmnStore } from '@/bpmn/store'
import DynamicBinder from '../../components/dynamic-binder/index.vue'

import './panel.css'

defineOptions({
  name: 'Panel'
})

const bpmnContext = BpmnStore
const contextState = bpmnContext.getState()

const panelState = reactive({
  elCollapses: [] as string[],
  shrinkageOff: false
})

watch(
  () => contextState.activeBindDefine,
  () => {
    if (contextState.activeBindDefine) {
      panelState.elCollapses = contextState.activeBindDefine
        .map((groupItem) => groupItem.name)
        .filter((name): name is string => name !== undefined)
    }
  }
)

// 动态数据绑定器的字段变化后更新到xml，视图刷新
// 需要注意，如果字段定义里边属性定义了`setValue`方法，则不会进这里了
function onFieldChange(key: string, value: unknown): void {
  const shape = bpmnContext.getShape()
  if (!shape) {
    return
  }
  bpmnContext.updateProperties(shape, {
    [key]: isRef(value) ? value.value : value
  })
}
</script>
