import {
  ProFieldEmptyText,
  proFieldParsingValueEnumToArray,
  ProFieldValueType
} from '@ant-design/pro-field';
import { IntlType } from '@ant-design/pro-provider';
import {
  isNil,
  LabelIconTip,
  omitUndefinedAndEmptyArr,
  ProSchemaComponentTypes,
  ProTableEditableFnType
} from '@ant-design/pro-utils';
import { Form, Space, Tooltip, Typography } from 'antd';
import { FormInstance } from 'antd/lib/form';
import { ColumnsType, TablePaginationConfig } from 'antd/lib/table';
import get from 'rc-util/lib/utils/get';
import React, { useEffect } from 'react';
import InlineErrorFormItem from './component/InlineErrorFormItem';
import { UseEditableUtilType } from './component/useEditable';
import { ColumnsState, useCounter } from './container';
import defaultRenderText, { spellNamePath } from './defaultRender';
import {
  ActionType,
  ProColumnGroupType,
  ProColumns,
  RequestData,
  UseFetchDataAction
} from './typing';



/**
 * 检查值是否存在
 * 为了 避开 0 和 false
 * @param value
 */
export const checkUndefinedOrNull = (value: any) => value !== undefined && value !== null;

/**
 *  根据 key 和 dataIndex 生成唯一 id
 * @param key 用户设置的 key
 * @param dataIndex 在对象中的数据
 * @param index 序列号，理论上唯一
 */
export const genColumnKey = (key?: React.ReactText | undefined, index?: number): string => {
  if (key) {
    return Array.isArray(key) ? key.join('-') : key.toString();
  }
  return `${index}`;
};

/**
 * 生成 Ellipsis 的 tooltip
 * @param dom
 * @param item
 * @param text
 */
export const genEllipsis = (dom: React.ReactNode, item: ProColumns<any>, text: string) => {
  if (!item.ellipsis) {
    return dom;
  }
  return (
    <Tooltip title={text}>
      <span>{dom}</span>
    </Tooltip>
  );
};

export const genCopyable = (dom: React.ReactNode, item: ProColumns<any>, text: string) => {
  if (item.copyable || item.ellipsis) {
    return (
      <Typography.Text
        style={{
          maxWidth: '100%',
          margin: 0,
          padding: 0,
        }}
        title=""
        copyable={
          item.copyable && text
            ? {
                text,
                tooltips: ['', ''],
              }
            : undefined
        }
        ellipsis={item.ellipsis}
      >
        {dom}
      </Typography.Text>
    );
  }
  return dom;
};

/**
 * 合并用户 props 和 预设的 props
 * @param pagination
 * @param action
 * @param intl
 */
export function mergePagination<T>(
  pagination: TablePaginationConfig | boolean | undefined = {},
  action: UseFetchDataAction<RequestData<T>>,
  intl: IntlType,
): TablePaginationConfig | false | undefined {
  if (pagination === false) {
    return false;
  }
  const defaultPagination: TablePaginationConfig | {} =
    typeof pagination === 'object' ? pagination : {};
  const { current, pageSize } = action;

  return {
    showTotal: (all, range) =>
      `${intl.getMessage('pagination.total.range', '第')} ${range[0]}-${range[1]} ${intl.getMessage(
        'pagination.total.total',
        '条/总共',
      )} ${all} ${intl.getMessage('pagination.total.item', '条')}`,
    showSizeChanger: true,
    total: action.total,
    ...(defaultPagination as TablePaginationConfig),
    current,
    pageSize,
    onChange: (page: number, newPageSize?: number) => {
      const { onChange } = pagination as TablePaginationConfig;
      onChange?.(page, newPageSize || 20);
      // pageSize 改变之后就没必要切换页码
      if (newPageSize !== pageSize || current !== page) {
        action.setPageInfo({ pageSize: newPageSize, page });
      }
    },
  };
}

/**
 * 获取用户的 action 信息
 * @param actionRef
 * @param counter
 * @param onCleanSelected
 */
export function useActionType<T>(
  ref: React.MutableRefObject<ActionType | undefined>,
  action: UseFetchDataAction<RequestData<T>>,
  props: {
    fullScreen: () => void;
    onCleanSelected: () => void;
    editableUtils: UseEditableUtilType;
  },
) {
  /**
   * 这里生成action的映射，保证 action 总是使用的最新
   * 只需要渲染一次即可
   */
  useEffect(() => {
    const userAction: ActionType = {
      ...props.editableUtils,
      reload: async (resetPageIndex?: boolean) => {
        // 如果为 true，回到第一页
        if (resetPageIndex) {
          await props.onCleanSelected();
        }
        await action?.reload();
      },
      reloadAndRest: async () => {
        // reload 之后大概率会切换数据，清空一下选择。
        props.onCleanSelected();
        await action?.reload();
      },
      reset: async () => {
        await props.onCleanSelected();
        await action?.reset?.();
        await action?.reload();
      },
      fullScreen: () => props.fullScreen(),
      clearSelected: () => props.onCleanSelected(),
    };
    // eslint-disable-next-line no-param-reassign
    ref.current = userAction;
  }, [props.editableUtils]);
}

type PostDataType<T> = (data: T) => T;

/**
 * 一个转化的 pipeline 列表
 * @param data
 * @param pipeline
 */
export function postDataPipeline<T>(data: T, pipeline: PostDataType<T>[]) {
  if (pipeline.filter((item) => item).length < 1) {
    return data;
  }
  return pipeline.reduce((pre, postData) => {
    return postData(pre);
  }, data);
}

export const tableColumnSort = (columnsMap: { [key: string]: ColumnsState }) => (
  a: any,
  b: any,
) => {
  const { fixed: aFixed, index: aIndex } = a;
  const { fixed: bFixed, index: bIndex } = b;
  if ((aFixed === 'left' && bFixed !== 'left') || (bFixed === 'right' && aFixed !== 'right')) {
    return -2;
  }
  if ((bFixed === 'left' && aFixed !== 'left') || (aFixed === 'right' && bFixed !== 'right')) {
    return 2;
  }
  // 如果没有index，在 dataIndex 或者 key 不存在的时候他会报错
  const aKey = a.key || `${aIndex}`;
  const bKey = b.key || `${bIndex}`;
  return (columnsMap[aKey]?.order || 0) - (columnsMap[bKey]?.order || 0);
};

/**
 * render title
 * @description 增加了 icon 的功能
 * @param item
 */
export const renderColumnsTitle = (item: ProColumns<any>) => {
  const { title } = item;
  if (title && typeof title === 'function') {
    return title(item, 'table', <LabelIconTip label={title} tooltip={item.tooltip || item.tip} />);
  }
  return <LabelIconTip label={title} tooltip={item.tooltip || item.tip} />;
};

export const defaultOnFilter = (value: string, record: any, dataIndex: string | string[]) => {
  const recordElement = Array.isArray(dataIndex)
    ? get(record, dataIndex as string[])
    : record[dataIndex];
  const itemValue = String(recordElement) as string;

  return String(itemValue) === String(value);
};

/**
 * 转化列的定义
 */
interface ColumnRenderInterface<T> {
  columnProps: ProColumns<T>;
  text: any;
  rowData: T;
  index: number;
  columnEmptyText?: ProFieldEmptyText;
  type: ProSchemaComponentTypes;
  counter: ReturnType<typeof useCounter>;
  editableUtils: UseEditableUtilType;
}

const isMergeCell = (
  dom: any, // 如果是合并单元格的，直接返回对象
) => dom && typeof dom === 'object' && dom?.props?.colSpan;

/**
 * 判断可不可编辑
 */
function isEditableCell<T>(
  text: any,
  rowData: T,
  index: number,
  editable?: ProTableEditableFnType<T> | boolean,
) {
  if (typeof editable === 'boolean') {
    return editable === false;
  }
  return editable?.(text, rowData, index) === false;
}

/**
 * 这个组件负责单元格的具体渲染
 * @param param0
 */
export function columnRender<T>({
  columnProps,
  text,
  rowData,
  index,
  columnEmptyText,
  counter,
  type,
  editableUtils,
}: ColumnRenderInterface<T>): any {
  const { action } = counter;
  const { isEditable, recordKey } = editableUtils.isEditable({ ...rowData, index });
  const { renderText = (val: any) => val } = columnProps;

  const renderTextStr = renderText(text, rowData, index, action.current as ActionType);
  const mode =
    isEditable && !isEditableCell(text, rowData, index, columnProps?.editable) ? 'edit' : 'read';

  const textDom = defaultRenderText<T>({
    text: renderTextStr,
    valueType: (columnProps.valueType as ProFieldValueType) || 'text',
    index,
    rowData,
    columnProps,
    columnEmptyText,
    type,
    recordKey,
    mode,
  });

  const dom: React.ReactNode = isEditable
    ? textDom
    : genEllipsis(genCopyable(textDom, columnProps, renderTextStr), columnProps, renderTextStr);

  /**
   * 如果是编辑模式，并且 renderFormItem 存在直接走 renderFormItem
   */
  if (mode === 'edit') {
    if (columnProps.valueType === 'option') {
      return (
        <Form.Item shouldUpdate noStyle>
          {(form: any) => (
            <Space size={16}>
              {editableUtils.actionRender(
                {
                  ...rowData,
                  index: columnProps.index || index,
                },
                form,
              )}
            </Space>
          )}
        </Form.Item>
      );
    }
    if (columnProps.renderFormItem) {
      return (
        <Form.Item shouldUpdate noStyle>
          {(form: any) => {
            const inputDom = columnProps.renderFormItem?.(
              {
                ...columnProps,
                isEditable: true,
              },
              {
                defaultRender: () => <>{dom}</>,
                type,
              },
              form,
            );
            return (
              <InlineErrorFormItem
                initialValue={text}
                name={spellNamePath(
                  recordKey || index,
                  columnProps?.key || columnProps?.dataIndex || index,
                )}
                {...columnProps.formItemProps}
              >
                {inputDom || dom}
              </InlineErrorFormItem>
            );
          }}
        </Form.Item>
      );
    }
  }

  if (columnProps.render) {
    const renderDom = columnProps.render(
      dom,
      rowData,
      index,
      {
        ...(action.current as ActionType),
        ...editableUtils,
      },
      {
        ...columnProps,
        isEditable,
      },
    );

    // 如果是合并单元格的，直接返回对象
    if (isMergeCell(renderDom)) {
      return renderDom;
    }

    if (renderDom && columnProps.valueType === 'option' && Array.isArray(renderDom)) {
      return <Space size={16}>{renderDom}</Space>;
    }
    return renderDom as React.ReactNode;
  }
  return !isNil(dom) ? dom : null;
}

/**
 * 转化 columns 到 pro 的格式
 * 主要是 render 方法的自行实现
 * @param columns
 * @param map
 * @param columnEmptyText
 */
export function genColumnList<T>(props: {
  columns: ProColumns<T>[];
  map: {
    [key: string]: ColumnsState;
  };
  counter: ReturnType<typeof useCounter>;
  columnEmptyText: ProFieldEmptyText;
  type: ProSchemaComponentTypes;
  editableUtils: UseEditableUtilType;
}): (ColumnsType<T>[number] & { index?: number })[] {
  const { columns, map, counter, columnEmptyText, type, editableUtils } = props;
  return (columns
    .map((columnProps, columnsIndex) => {
      const {
        key,
        dataIndex,
        valueEnum,
        valueType,
        children,
        filters = [],
      } = columnProps as ProColumnGroupType<T>;
      const columnKey = genColumnKey(key, columnsIndex);
      // 这些都没有，说明是普通的表格不需要 pro 管理
      const noNeedPro = !dataIndex && !valueEnum && !valueType && !children;
      if (noNeedPro) {
        return columnProps;
      }
      const { propsRef } = counter;
      const config = map[columnKey] || { fixed: columnProps.fixed };
      const tempColumns = {
        onFilter:
          !propsRef.current?.request || filters === true
            ? (value: string, row: T) => defaultOnFilter(value, row, dataIndex as string[])
            : undefined,
        index: columnsIndex,
        ...columnProps,
        title: renderColumnsTitle(columnProps),
        valueEnum,
        filters:
          filters === true
            ? proFieldParsingValueEnumToArray(valueEnum).filter(
                (valueItem) => valueItem && valueItem.value !== 'all',
              )
            : filters,
        ellipsis: false,
        fixed: config.fixed,
        width: columnProps.width || (columnProps.fixed ? 200 : undefined),
        children: (columnProps as ProColumnGroupType<T>).children
          ? genColumnList({ ...props, columns: (columnProps as ProColumnGroupType<T>)?.children })
          : undefined,
        render: (text: any, rowData: T, index: number) => {
          const renderProps = {
            columnProps,
            text,
            rowData,
            index,
            columnEmptyText,
            counter,
            type,
            editableUtils,
          };
          return columnRender<T>(renderProps);
        },
      };
      return omitUndefinedAndEmptyArr(tempColumns);
    })
    .filter((item) => !item.hideInTable) as unknown) as Array<
    ColumnsType<T>[number] & {
      index?: number;
    }
  >;
}

/**
 * 因为 fieldProps 支持了 function
 * 所以新增了这个方法
 * @param fieldProps
 * @param form
 */
export const getFieldPropsOrFormItemProps = (
  fieldProps: any,
  form?: FormInstance<any>,
  extraProps?: any,
): Object & {
  onChange: any;
} => {
  if (typeof fieldProps === 'function') {
    return fieldProps(form, extraProps);
  }
  return fieldProps;
};
