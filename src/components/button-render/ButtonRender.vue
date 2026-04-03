<template>
  <div class="button-render">
    <template v-for="item in buttons" :key="item.label">
      <el-button v-if="!item.icon" round type="info" @click="handleClick(item)">
        {{ item.label }}
      </el-button>

      <el-tooltip
        v-else
        class="render-icon-tooltip"
        effect="light"
        :content="item.label"
        placement="top"
        :offset="10"
        :open-delay="300"
      >
        <div class="render-icon" @click="handleClick(item)">
          <svg class="icon" aria-hidden="true">
            <use :xlink:href="`#${item.icon}`" />
          </svg>
        </div>
      </el-tooltip>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ElButton, ElTooltip } from 'element-plus'
import type { Button } from './index'

defineOptions({
  name: 'ButtonRender'
})

interface Props {
  buttons: Button[]
  buttonClick?: (btn: Button) => void
}

const props = withDefaults(defineProps<Props>(), {
  buttonClick: () => (item: any) => {
    console.log(item)
  }
})

const handleClick = (item: Button) => {
  if (item.action) {
    item.action()
  } else if (props.buttonClick) {
    props.buttonClick(item)
  }
}
</script>
