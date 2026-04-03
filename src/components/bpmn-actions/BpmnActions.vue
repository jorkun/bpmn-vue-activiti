<template>
  <div class="bpmn-actions">
    <ButtonRender :buttons="buttons" />

    <el-drawer size="35%" direction="ltr" :with-header="false" v-model="previewActive">
      <textarea id="xml-highlight-container" v-model="xml" />
    </el-drawer>

    <input
      ref="refFile"
      type="file"
      id="bpmn-upload-element"
      style="display: none"
      accept=".xml, .bpmn"
      @change="importFile"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import ButtonRender from '../../components/button-render/index.vue'
import { BpmnStore } from '@/bpmn/store'
import CodeMirror from 'codemirror'
import type { Button } from '../../components/button-render'
import type { ModdleElement } from '@/bpmn/type'

import 'codemirror/mode/xml/xml.js'
import 'codemirror/addon/hint/xml-hint.js'
import 'codemirror/lib/codemirror.css'
import 'codemirror/theme/material.css'
import './bpmn-actions.css'

defineOptions({
  name: 'BpmnActions'
})

// 放大缩小
const zoom = ref(1)
// 预览xml的抽屉控制器
const previewActive = ref(false)
// 取到的xml
const xml = ref('')
const refFile = ref<HTMLInputElement>()
let coder: CodeMirror.EditorFromTextArea | null = null

const bpmnContext = BpmnStore

const buttons: Button[] = [
  {
    label: '导入',
    icon: 'icon-shangchuan',
    action: () => {
      document.getElementById('bpmn-upload-element')?.click()
    }
  },
  {
    label: '导出SVG',
    icon: 'icon-zu920',
    action: () => {
      const rootElement: ModdleElement = bpmnContext.getModeler().get('canvas').getRootElement()
      bpmnContext
        .getSVG()
        .then((response) => {
          download(response.svg, rootElement.id || 'process', 'svg')
        })
        .catch((err: unknown) => {
          console.warn(err)
        })
    }
  },
  {
    label: '导出XML',
    icon: 'icon-zu1359',
    action: () => {
      const rootElement: ModdleElement = bpmnContext.getModeler().get('canvas').getRootElement()
      bpmnContext
        .getXML()
        .then((response: { xml: string }) => {
          download(response.xml, rootElement.id || 'process', 'bpmn')
        })
        .catch((err: unknown) => {
          console.warn(err)
        })
    }
  },
  {
    label: '放大',
    icon: 'icon-fangda',
    action: () => {
      zoom.value = Math.floor(zoom.value * 100 + 0.1 * 100) / 100
      bpmnContext.getModeler().get('canvas').zoom(zoom.value)
    }
  },
  {
    label: '缩小',
    icon: 'icon-suoxiao',
    action: () => {
      zoom.value = Math.floor(zoom.value * 100 - 0.1 * 100) / 100
      bpmnContext.getModeler().get('canvas').zoom(zoom.value)
    }
  },
  {
    label: '还原并居中',
    icon: 'icon-quxiaoquanping',
    action: () => {
      zoom.value = 1
      bpmnContext.getModeler().get('canvas').zoom('fit-viewport', 'auto')
    }
  },
  {
    label: '预览',
    icon: 'icon-xianshi',
    action: () => {
      bpmnContext
        .getXML()
        .then((response) => {
          xml.value = response.xml
          previewActive.value = true

          nextTick(() => {
            if (!coder) {
              coder = CodeMirror.fromTextArea(
                document.getElementById('xml-highlight-container') as HTMLTextAreaElement,
                {
                  lineWrapping: true,
                  mode: 'application/xml',
                  theme: 'material',
                  lineNumbers: true,
                  lint: true
                }
              )
              coder.setSize('100%', '100%')
            } else {
              coder.setValue(xml.value)
            }
          })
        })
        .catch((err: unknown) => {
          console.warn(err)
        })
    }
  }
]

function importFile(event: Event) {
  const eventTarget = event.target as HTMLInputElement
  if (eventTarget.files) {
    const file = eventTarget.files[0]
    const reader = new FileReader()
    reader.readAsText(file)
    reader.onload = function () {
      if (this.result) {
        bpmnContext.importXML(this.result as string)
      }
    }
  }
}

// 文本下载
function download(data: string, filename: string, type: string): void {
  const blob = new Blob([data])
  const tempLink = document.createElement('a')
  const href = window.URL.createObjectURL(blob)
  const fileName = `${filename}.${type}`
  tempLink.href = href
  tempLink.target = '_blank'
  tempLink.download = fileName
  document.body.appendChild(tempLink)
  tempLink.click()
  document.body.removeChild(tempLink)
  window.URL.revokeObjectURL(href)
}
</script>
