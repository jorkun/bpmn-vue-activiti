import { ElFormItem, ElInput, ElOption, ElSelect } from 'element-plus';
import { h } from 'vue';
import { FieldDefine } from '@/components/dynamic-binder';
import { PropertiesMap, GroupProperties } from './index';
import SubList from '../../components/sublist/SubList';
import { SubListState } from '@/components/sublist/type';
import { ModdleElement } from '../type';
import { BpmnStore } from '../store';

/**
 * 所有通用节点的属性（每个节点都有的）
 */
const commonProperties: PropertiesMap<FieldDefine> = {
  id: {
    component: ElInput,
    placeholder: '节点ID',
    vSlots: {
      prepend: () => h('div', '节点ID'),
    },
    setValue(sourceObject: ModdleElement, key: string, value: string) {
      const isNotNull = value;
      const latestValue = value || ' ';
      const shape = BpmnStore.getShape();
      BpmnStore.updateProperties(shape, {
        [key]: isNotNull ? latestValue.trim() : latestValue,
      });
    },
  },
  name: {
    component: ElInput,
    placeholder: '节点名称',
    vSlots: {
      prepend: () => h('div', '节点名称'),
    },
  },
};

/**
 * （基础信息）每个节点都有的
 */
export const CommonGroupProperties: GroupProperties = {
  name: '基础信息',
  icon: 'el-icon-info',
  properties: { ...commonProperties },
};

interface Documentation {
  text: string;
}

export const DocumentGroupProperties: GroupProperties = {
  name: '元素文档',
  icon: 'el-icon-document',
  properties: {
    'documentation.text': {
      component: ElInput,
      type: 'textarea',
      getValue: (obj: { documentation: Array<Documentation> }): string => {
        return obj['documentation']?.[0]?.['text'] ?? '';
      },
      setValue(businessObject: ModdleElement, key: string, value: unknown): void {
        BpmnStore.createElement('bpmn:Documentation', 'documentation', { text: value }, true);
      },
    },
  },
};

interface PropertyElement {
  $type: string;
  name: string;
  value: unknown;
}

/**
 * 流程事件类型选项
 */
const EVENT_OPTIONS = [
  { label: '开始', value: 'start' },
  { label: '结束', value: 'end' },
];

/**
 * 监听器类型选项
 */
const TYPE_OPTIONS = [
  { label: 'java类', value: 'class' },
  { label: '调用表达式', value: 'expression' },
  { label: '注入表达式', value: 'delegateExpression' },
];

/**
 * 获取节点类型的监听器属性配置组
 * @param options 参数
 */
import { TaskNameMapping } from './TypeNameMapping';

const taskTags = Object.keys(TaskNameMapping);
export const getElementTypeListenerProperties = function (options: {
  name: string;
  icon?: string;
  // 时间类型选项
  eventOptions?: Array<{ label: string; value: string }>;
}): GroupProperties {
  const eventOptions = options.eventOptions || EVENT_OPTIONS;
  return {
    name: options.name || '监听器',
    icon: options.icon || 'el-icon-bell',
    properties: {
      'extensionElements.listeners': {
        component: SubList,
        columns: [
          {
            type: 'index',
            label: '序号',
            align: 'center',
          },
          {
            prop: 'event',
            label: '事件',
            align: 'center',
            formatter: (row: any, column: any): string => {
              return eventOptions.filter((item) => item.value === row[column.property])[0].label;
            },
            editComponent: function (scope: any, state: SubListState<any>) {
              return h(
                ElFormItem,
                {
                  size: 'small',
                  class: 'sublist-form-item',
                  label: scope.column.name,
                  prop: scope.column.property,
                },
                () =>
                  h(
                    ElSelect,
                    {
                      modelValue: state.editItem.event,
                      'onUpdate:modelValue': (val: any) => {
                        state.editItem.event = val;
                      },
                    },
                    () => eventOptions.map((option) => h(ElOption, { key: option.value, label: option.label, value: option.value }))
                  )
              );
            },
          },
          {
            prop: 'type',
            label: '执行类型',
            align: 'center',
            formatter: (row: any, column: any) => {
              return TYPE_OPTIONS.filter((item) => item.value === row[column.property])[0].label;
            },
            editComponent: function (scope: any, state: SubListState<any>) {
              return h(
                ElFormItem,
                {
                  size: 'small',
                  class: 'sublist-form-item',
                  label: scope.column.name,
                  prop: scope.column.property,
                },
                () =>
                  h(
                    ElSelect,
                    {
                      modelValue: state.editItem.type,
                      'onUpdate:modelValue': (val: any) => {
                        state.editItem.type = val;
                      },
                    },
                    () => TYPE_OPTIONS.map((option) => h(ElOption, { key: option.value, label: option.label, value: option.value }))
                  )
              );
            },
          },
          {
            prop: 'content',
            label: '执行内容',
            align: 'center',
          },
        ],
        rules: {
          event: [{ required: true, message: '事件不能为空' }],
          type: [{ required: true, message: '类型不能为空' }],
          content: [{ required: true, message: '执行内容不能为空' }],
        },
        getValue: (businessObject: ModdleElement): Array<any> => {
          const listenerTagName = taskTags?.includes(businessObject.$type)
            ? 'activiti:TaskListener'
            : 'activiti:ExecutionListener';
          const listeners = businessObject?.extensionElements?.values?.filter(
            (item: ModdleElement) => item.$type === listenerTagName,
          );

          return listeners
            ? listeners?.map((item: ModdleElement) => {
                const type = item.expression
                  ? 'expression'
                  : item.delegateExpression
                  ? 'delegateExpression'
                  : 'class';
                return {
                  event: item.event,
                  type: type,
                  content: item[type],
                };
              })
            : [];
        },
        setValue(businessObject: ModdleElement, key: string, value: []): void {
          const bpmnContext = BpmnStore;
          const moddle = bpmnContext.getModeler().get('moddle');
          // 判断当前活动的模型类型，使用不同类型的标签监听器
          const listenerTagName = taskTags.includes(businessObject.$type)
            ? 'activiti:TaskListener'
            : 'activiti:ExecutionListener';
          bpmnContext.updateExtensionElements(
            listenerTagName,
            value.map((attr: { event: string; type: string; content: string }) => {
              return moddle.create(listenerTagName, {
                event: attr.event,
                [attr.type]: attr.content,
              });
            }),
          );
        },
      },
    },
  };
};

/**
 * 扩展属性组配置
 */
export const ExtensionGroupProperties: GroupProperties = {
  name: '扩展属性',
  icon: 'el-icon-document-add',
  properties: {
    'extensionElements.properties': {
      component: SubList,
      columns: [
        {
          type: 'index',
          label: '序号',
          align: 'center',
        },
        {
          prop: 'name',
          label: '属性名',
          align: 'center',
        },
        {
          prop: 'value',
          label: '属性值',
          align: 'center',
        },
      ],
      rules: {
        name: [{ required: true, message: '属性名不能为空' }],
        value: [{ required: true, message: '属性值不能为空' }],
      },
      getValue: (businessObject: ModdleElement): Array<any> => {
        const extProperties = businessObject?.extensionElements?.values?.filter(
          (item: PropertyElement) => item.$type === 'activiti:Properties',
        )[0]?.values;
        return extProperties
          ? extProperties.map((item: PropertyElement) => ({
              name: item.name,
              value: item.value,
            }))
          : [];
      },
      setValue(businessObject: ModdleElement, key: string, value: []): void {
        const bpmnContext = BpmnStore;
        const moddle = bpmnContext.getModeler().get('moddle');
        const properties = moddle.create(`activiti:Properties`, {
          values: value.map((attr: { name: string; value: unknown }) => {
            return moddle.create(`activiti:Property`, { name: attr.name, value: attr.value });
          }),
        });
        bpmnContext.updateExtensionElements('activiti:Properties', properties);
      },
    },
  },
};

interface FromPropertyElement {
  $type: string;
  id: string;
  type: string;
  $attrs: FromPropertyAttrsElement;
}

interface FromPropertyAttrsElement {
  name: string;
}

/**
 * （基础信息）表单
 */
export const FormGroupProperties: GroupProperties = {
  name: '表单信息',
  icon: 'el-icon-edit',
  properties: {
    formKey: {
      component: ElInput,
      placeholder: '表单key',
      vSlots: {
        prepend: () => h('div', '表单key'),
      },
    },
    'extensionElements.formProperty': {
      component: SubList,
      columns: [
        {
          prop: 'id',
          label: '编码',
          align: 'center',
        },
        {
          prop: 'type',
          label: '类型',
          align: 'center',
        },
        {
          prop: 'name',
          label: '名称',
          align: 'center',
        },
      ],
      rules: {
        id: [{ required: true, message: '编码不能为空' }],
        type: [{ required: true, message: '类型不能为空' }],
        name: [{ required: true, message: '名称不能为空' }],
      },
      getValue: (businessObject: ModdleElement): Array<FromPropertyElement> => {
        const formProperties = businessObject?.extensionElements?.values?.filter(
          (item: FromPropertyElement) => item.$type === 'activiti:FormProperty',
        );
        return formProperties
          ? formProperties.map((elem: FromPropertyElement) => {
              return { id: elem?.id, type: elem.type, name: elem?.$attrs?.name };
            })
          : [];
      },
      setValue(businessObject: ModdleElement, key: string, value: []): void {
        const bpmnContext = BpmnStore;
        const moddle = bpmnContext.getModeler().get('moddle');
        // 表单数据值对象
        const formProperties = value.map((attr: { id: string; type: string; name: string }) => {
          return moddle.create('activiti:FormProperty', {
            id: attr.id,
            name: attr.name,
            type: attr.type,
          });
        });

        bpmnContext.updateExtensionElements('activiti:FormProperty', formProperties);
      },
    },
  },
};
