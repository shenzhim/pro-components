import React, {
  useContext,
  useRef,
  useState,
  useCallback,
  useMemo,
  useImperativeHandle,
  useEffect,
} from 'react';
import { Table, ConfigProvider, Form, Card, Empty } from 'antd';
import { useIntl, ParamsType, ConfigProviderWrap } from '@ant-design/pro-provider';
import classNames from 'classnames';
import useMergedState from 'rc-util/lib/hooks/useMergedState';
import { stringify } from 'use-json-comparison';
import { TablePaginationConfig } from 'antd/lib/table';
import { TableCurrentDataSource, SorterResult, SortOrder } from 'antd/lib/table/interface';
import { useDeepCompareEffect, omitUndefined } from '@ant-design/pro-utils';

import useFetchData from './useFetchData';
import Container from './container';
import Toolbar from './component/ToolBar';
import Alert from './component/Alert';
import FormSearch from './Form';
import {
  genColumnKey,
  mergePagination,
  useActionType,
  postDataPipeline,
  tableColumnSort,
  genColumnList,
} from './utils';
import ErrorBoundary from './component/ErrorBoundary';

import './index.less';
import useEditable from './component/useEditable';
import { ProTableProps, RequestData, TableRowSelection } from './typing';
import { ActionType } from '.';

/**
 * 🏆 Use Ant Design Table like a Pro!
 * 更快 更好 更方便
 * @param props
 */
const ProTable = <T extends {}, U extends ParamsType>(
  props: ProTableProps<T, U> & {
    defaultClassName: string;
  },
) => {
  const {
    request,
    className: propsClassName,
    params = {},
    defaultData = [],
    headerTitle,
    postData,
    pagination: propsPagination,
    actionRef: propsActionRef,
    columns: propsColumns = [],
    toolBarRender,
    onLoad,
    onRequestError,
    style,
    cardProps,
    tableStyle,
    tableClassName,
    columnsStateMap,
    onColumnsStateChange,
    options,
    search,
    rowSelection: propsRowSelection = false,
    beforeSearchSubmit = (searchParams: Partial<U>) => searchParams,
    tableAlertRender,
    defaultClassName,
    formRef,
    type = 'table',
    columnEmptyText = '-',
    manualRequest = false,
    toolbar,
    ...rest
  } = props;
  const actionRef = useRef<ActionType>();

  /**
   * 绑定 action ref
   */
  useImperativeHandle(propsActionRef, () => actionRef.current, [actionRef.current]);
  useEffect(() => {
    if (typeof propsActionRef === 'function' && actionRef.current) {
      propsActionRef(actionRef.current);
    }
  }, [actionRef.current]);

  const [selectedRowKeys, setSelectedRowKeys] = useMergedState<React.ReactText[]>([], {
    value: propsRowSelection ? propsRowSelection.selectedRowKeys : undefined,
  });

  const [selectedRows, setSelectedRows] = useState<T[]>([]);

  const setSelectedRowsAndKey = (keys: React.ReactText[], rows: T[]) => {
    setSelectedRowKeys(keys);
    setSelectedRows(rows);
  };

  const [formSearch, setFormSearch] = useState<{} | undefined>(undefined);

  const [proFilter, setProFilter] = useState<{
    [key: string]: React.ReactText[];
  }>({});
  const [proSort, setProSort] = useState<{
    [key: string]: SortOrder;
  }>({});

  /**
   * 获取 table 的 dom ref
   */
  const rootRef = useRef<HTMLDivElement>(null);
  const intl = useIntl();

  /**
   * 是否首次加载的指示器
   */
  const manualRequestRef = useRef<boolean>(manualRequest);

  /**
   * 需要初始化 不然默认可能报错
   * 这里取了 defaultCurrent 和 current
   * 为了保证不会重复刷新
   */
  const fetchPagination =
    typeof propsPagination === 'object'
      ? (propsPagination as TablePaginationConfig)
      : { defaultCurrent: 1, defaultPageSize: 20, pageSize: 20, current: 1 };

  // ============================ useFetchData ============================
  const action = useFetchData(
    async (pageParams) => {
      // 需要手动触发的首次请求
      if (!request || manualRequestRef.current) {
        manualRequestRef.current = false;
        return {
          data: props.dataSource || [],
          success: true,
        } as RequestData<T>;
      }

      const actionParams = {
        ...(pageParams || {}),
        ...formSearch,
        ...params,
      };
      // eslint-disable-next-line no-underscore-dangle
      delete (actionParams as any)._timestamp;
      const response = await request((actionParams as unknown) as U, proSort, proFilter);
      const responseData = postDataPipeline<T[]>(
        response.data,
        [postData].filter((item) => item) as any,
      );
      if (Array.isArray(response)) {
        return response;
      }
      const msgData = { ...response, data: responseData } as RequestData<T>;
      return msgData;
    },
    defaultData,
    {
      ...fetchPagination,
      loading: props.loading,
      dataSource: props.dataSource,
      onDataSourceChange: props.onDataSourceChange,
      pagination: propsPagination !== false,
      onLoad,
      onRequestError,
      manual: !request || (!formSearch && search !== false),
      effects: [stringify(params), stringify(formSearch), stringify(proFilter), stringify(proSort)],
    },
  );
  // ============================ END ============================

  /**
   * 页面编辑的计算
   */
  const pagination = useMemo(() => mergePagination<T>(propsPagination, action, intl), [
    propsPagination,
    action.total,
    action.pageSize,
    action.current,
    action.setPageInfo,
    intl,
  ]);

  const counter = Container.useContainer();

  /**
   * 清空所有的选中项
   */
  const onCleanSelected = useCallback(() => {
    if (propsRowSelection && propsRowSelection.onChange) {
      propsRowSelection.onChange([], []);
    }
    setSelectedRowsAndKey([], []);
  }, [setSelectedRowKeys, propsRowSelection]);

  counter.setAction(actionRef.current);
  counter.propsRef.current = props;

  // ============================ RowKey ============================
  const getRowKey = React.useMemo<any>(() => {
    const { rowKey } = props;
    if (typeof rowKey === 'function') {
      return rowKey;
    }
    return (record: T, index: number) => (record as any)?.[rowKey as string] ?? `${index}`;
  }, [props.rowKey]);

  /**
   * 可编辑行的相关配置
   */
  const editableUtils = useEditable<any>({
    ...props.editable,
    getRowKey,
    childrenColumnName: props.expandable?.childrenColumnName,
    dataSource: action.dataSource,
    setDataSource: action.setDataSource,
  });
  /**
   * 绑定 action
   */
  useActionType(actionRef, action, {
    fullScreen: () => {
      if (!rootRef.current || !document.fullscreenEnabled) {
        return;
      }
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        rootRef.current.requestFullscreen();
      }
    },
    onCleanSelected: () => {
      // 清空选中行
      onCleanSelected();
      // 清空筛选
      setProFilter({});
      // 清空排序
      setProSort({});
      // 清空 toolbar 搜索
      counter.setKeyWords(undefined);
      // 重置页码
      action.resetPageIndex();
    },
    editableUtils,
  });

  // ---------- 列计算相关 start  -----------------
  const tableColumn = useMemo(() => {
    return genColumnList<T>({
      columns: propsColumns,
      map: counter.columnsMap,
      counter,
      columnEmptyText,
      type,
      editableUtils,
    }).sort(tableColumnSort(counter.columnsMap));
  }, [propsColumns, editableUtils.editableKeys.join(',') || 'null', counter.columnsMap, getRowKey]);

  /**
   * Table Column 变化的时候更新一下，这个参数将会用于渲染
   */
  useDeepCompareEffect(() => {
    if (tableColumn && tableColumn.length > 0) {
      // 重新生成key的字符串用于排序
      const columnKeys = tableColumn.map((item, index) => genColumnKey(item.key, index));
      counter.setSortKeyColumns(columnKeys);
    }
  }, [tableColumn]);
  // ---------- 列计算相关 end-----------------

  /**
   * 同步 Pagination，支持受控的 页码 和 pageSize
   */
  useDeepCompareEffect(() => {
    const { current, pageSize } = propsPagination || {};
    if (
      propsPagination &&
      (current || pageSize) &&
      (pageSize !== action.pageSize || current !== action.current)
    ) {
      action.setPageInfo({
        pageSize: pageSize || action.pageSize,
        page: current || action.current,
      });
    }
  }, [propsPagination && propsPagination.pageSize, propsPagination && propsPagination.current]);

  /**
   * 行选择相关的问题
   */
  const rowSelection: TableRowSelection = {
    selectedRowKeys,
    ...propsRowSelection,
    onChange: (keys, rows) => {
      if (propsRowSelection && propsRowSelection.onChange) {
        propsRowSelection.onChange(keys, rows);
      }
      setSelectedRowsAndKey(keys, rows);
    },
  };

  const onSubmit = useCallback(
    (value, firstLoad) => {
      if (type !== 'form') {
        const submitParams = {
          ...value,
          _timestamp: Date.now(),
        };
        setFormSearch(beforeSearchSubmit(submitParams));
        if (!firstLoad) {
          // back first page
          action.resetPageIndex();
        }
      }
      // 不是第一次提交就不触发，第一次提交是 js 触发的
      // 为了解决 https://github.com/ant-design/pro-components/issues/579
      if (props.onSubmit && !firstLoad) {
        props.onSubmit(value);
      }
    },
    [props.onSubmit],
  );

  const onReset = useCallback(
    (value) => {
      setFormSearch(beforeSearchSubmit(value));
      // back first page
      action.resetPageIndex();
      props.onReset?.();
    },
    [props.onReset],
  );

  if ((!props.columns || props.columns.length < 1) && !props.tableViewRender) {
    return (
      <Card bordered={false} bodyStyle={{ padding: 50 }}>
        <Empty />
      </Card>
    );
  }

  const className = classNames(defaultClassName, propsClassName);
  /**
   * 查询表单相关的配置
   */
  const searchNode =
    search !== false || type === 'form' ? (
      <FormSearch<U, T>
        submitButtonLoading={!!action.loading}
        columns={propsColumns}
        {...rest}
        type={type}
        formRef={formRef}
        onSubmit={onSubmit}
        onReset={onReset}
        dateFormatter={rest.dateFormatter}
        search={search}
        form={rest.form}
      />
    ) : null;

  /**
   * 是不是 LightFilter, LightFilter 有一些特殊的处理
   */
  const isLightFilter: boolean = search !== false && search?.filterType === 'light';

  /**
   * 根据表单类型的不同决定是否生成 toolbarProps
   */
  const toolbarProps = isLightFilter
    ? {
        filter: searchNode,
        ...toolbar,
      }
    : toolbar;

  const toolbarDom =
    toolBarRender !== false &&
    (options !== false || headerTitle || toolBarRender || toolbarProps) ? (
      // if options= false & headerTitle=== false, hide Toolbar
      <Toolbar<T>
        columns={tableColumn}
        options={options}
        headerTitle={headerTitle}
        editableUtils={editableUtils}
        action={actionRef}
        onSearch={(keyword) => {
          if (!options || !options.search) {
            return;
          }
          const { name = 'keyword' } = options.search === true ? {} : options.search;
          setFormSearch(
            omitUndefined({
              ...formSearch,
              _timestamp: Date.now(),
              [name]: keyword,
            }),
          );
        }}
        selectedRows={selectedRows}
        selectedRowKeys={selectedRowKeys}
        toolBarRender={toolBarRender}
        toolbar={toolbarProps}
      />
    ) : undefined;
  /**
   * 内置的多选操作栏
   */
  const alertDom = propsRowSelection !== false && (
    <Alert<T>
      selectedRowKeys={selectedRowKeys}
      selectedRows={selectedRows}
      onCleanSelected={onCleanSelected}
      alertOptionRender={rest.tableAlertOptionRender}
      alertInfoRender={tableAlertRender}
    />
  );

  /**
   * 如果所有列中的 filters=true| undefined
   * 说明是用的是本地筛选
   */
  const useLocaleFilter = propsColumns.every(
    (column) => column.filters === undefined || column.filters === true,
  );
  const editableDataSource = (): T[] => {
    const { options: newLineOptions, row } = editableUtils.newLineRecord || {};
    if (newLineOptions?.position === 'top') {
      return [row, ...action.dataSource];
    }
    return [...action.dataSource, row];
  };

  const tableProps = {
    ...rest,
    size: counter.tableSize,
    rowSelection: propsRowSelection === false ? undefined : rowSelection,
    className: tableClassName,
    style: tableStyle,
    columns: tableColumn.filter((item) => {
      // 删掉不应该显示的
      const columnKey = genColumnKey(item.key, item.index);
      const config = counter.columnsMap[columnKey];
      if (config && config.show === false) {
        return false;
      }
      return true;
    }),
    loading: action.loading,
    dataSource: editableUtils.newLineRecord ? editableDataSource() : action.dataSource,
    pagination,
    onChange: (
      changePagination: TablePaginationConfig,
      filters: {
        [string: string]: React.ReactText[] | null;
      },
      sorter: SorterResult<T> | SorterResult<T>[],
      extra: TableCurrentDataSource<T>,
    ) => {
      if (rest.onChange) {
        rest.onChange(changePagination, filters, sorter, extra);
      }
      if (!useLocaleFilter) {
        setProFilter(omitUndefined<any>(filters));
      }

      // 制造筛选的数据
      // 制造一个排序的数据
      if (Array.isArray(sorter)) {
        const data = sorter.reduce<{
          [key: string]: any;
        }>(
          (pre, value) => ({
            ...pre,
            [`${value.field}`]: value.order,
          }),
          {},
        );
        setProSort(omitUndefined<any>(data));
      } else {
        setProSort(omitUndefined({ [`${sorter.field}`]: sorter.order as SortOrder }));
      }
    },
  };

  /**
   * 如果有 ellipsis ，设置 tableLayout 为 fixed
   */
  const tableLayout = props.columns?.some((item) => item.ellipsis) ? 'fixed' : 'auto';

  /**
   * 默认的 table dom，如果是编辑模式，外面还要包个 form
   */
  const baseTableDom = (
    <Form component={false}>
      <Table<T> {...tableProps} tableLayout={tableLayout} />
    </Form>
  );

  /**
   * 自定义的 render
   */
  const tableDom = props.tableViewRender
    ? props.tableViewRender(tableProps, baseTableDom)
    : baseTableDom;

  /**
   * table 区域的 dom，为了方便 render
   */
  const tableAreaDom = (
    <Card
      bordered={false}
      style={{
        height: '100%',
      }}
      bodyStyle={
        toolbarDom
          ? {
              paddingTop: 0,
              paddingBottom: 0,
            }
          : {
              padding: 0,
            }
      }
      {...cardProps}
    >
      {toolbarDom}
      {alertDom}
      {tableDom}
    </Card>
  );

  const renderTable = () => {
    if (props.tableRender) {
      return props.tableRender(props, tableAreaDom, {
        toolbar: toolbarDom || undefined,
        alert: alertDom || undefined,
        table: tableDom || undefined,
      });
    }
    return tableAreaDom;
  };

  const proTableDom = (
    <div className={className} id="ant-design-pro-table" style={style} ref={rootRef}>
      {isLightFilter ? null : searchNode}
      {/* 渲染一个额外的区域，用于一些自定义 */}
      {type !== 'form' && props.tableExtraRender && (
        <div className={`${className}-extra`}>
          {props.tableExtraRender(props, action.dataSource)}
        </div>
      )}
      {type !== 'form' && renderTable()}
    </div>
  );

  // 如果不需要的全屏，ConfigProvider 没有意义
  if (!options || !options?.fullScreen) {
    return proTableDom;
  }
  return (
    <ConfigProvider
      getPopupContainer={() => ((rootRef.current || document.body) as any) as HTMLElement}
    >
      {proTableDom}
    </ConfigProvider>
  );
};

/**
 * 🏆 Use Ant Design Table like a Pro!
 * 更快 更好 更方便
 * @param props
 */
const ProviderWarp = <T, U extends { [key: string]: any } = {}>(props: ProTableProps<T, U>) => {
  const { getPrefixCls } = useContext(ConfigProvider.ConfigContext);
  return (
    <Container.Provider initialState={props}>
      <ConfigProviderWrap>
        <ErrorBoundary>
          <ProTable defaultClassName={getPrefixCls('pro-table')} {...props} />
        </ErrorBoundary>
      </ConfigProviderWrap>
    </Container.Provider>
  );
};

export default ProviderWarp;
