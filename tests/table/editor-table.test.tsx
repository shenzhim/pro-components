import React, { useRef } from 'react';
import { Button, InputNumber } from 'antd';
import useMergedState from 'rc-util/lib/hooks/useMergedState';
import { EditableProTable, TableRowEditable, ProColumns, ActionType } from '@ant-design/pro-table';
import { mount, render } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { waitForComponentToPaint, waitTime } from '../util';

interface DataSourceType {
  id: number;
  title?: string;
  labels?: {
    name: string;
    color: string;
  }[];
  state?: string;
  time?: {
    created_at?: string;
  };
  children?: DataSourceType[];
}

const defaultData: DataSourceType[] = [
  {
    id: 624748504,
    title: '🐛 [BUG]yarn install命令 antd2.4.5会报错',
    labels: [{ name: 'bug', color: 'error' }],
    time: {
      created_at: '2020-05-26T09:42:56Z',
    },
    state: 'processing',
  },
  {
    id: 624691229,
    title: '🐛 [BUG]无法创建工程npm create umi',
    labels: [{ name: 'bug', color: 'error' }],
    time: {
      created_at: '2020-05-26T08:19:22Z',
    },
    state: 'closed',
  },
  {
    id: 624674790,
    title: '🧐 [问题] build 后还存在 es6 的代码（Umi@2.13.13）',
    labels: [{ name: 'question', color: 'success' }],
    state: 'open',
    time: {
      created_at: '2020-05-26T07:54:25Z',
    },
    children: [
      {
        id: 6246747901,
        title: '嵌套数据的编辑',
        labels: [{ name: 'question', color: 'success' }],
        state: 'closed',
        time: {
          created_at: '2020-05-26T07:54:25Z',
        },
        children: [
          {
            id: 62467479012,
            title: '嵌套数据的编辑',
            labels: [{ name: 'question', color: 'success' }],
            state: 'closed',
            time: {
              created_at: '2020-05-26T07:54:25Z',
            },
          },
        ],
      },
    ],
  },
];

const columns: ProColumns<DataSourceType>[] = [
  {
    dataIndex: 'index',
    valueType: 'indexBorder',
    width: 48,
    renderFormItem: () => <InputNumber />,
  },
  {
    title: '标题',
    dataIndex: 'title',
    copyable: true,
    ellipsis: true,
    tip: '标题过长会自动收缩',
    formItemProps: {
      rules: [
        {
          required: true,
          message: '此项为必填项',
        },
      ],
    },
    width: '30%',
    search: false,
  },
  {
    title: '状态',
    dataIndex: 'state',
    initialValue: 'open',
    filters: true,
    valueType: 'select',
    width: 120,
    valueEnum: {
      all: { text: '全部', status: 'Default' },
      open: {
        text: '未解决',
        status: 'Error',
      },
      closed: {
        text: '已解决',
        status: 'Success',
      },
      processing: {
        text: '解决中',
        status: 'Processing',
      },
    },
  },
  {
    title: '创建时间',
    dataIndex: ['time', 'created_at'],
    valueType: 'date',
  },
  {
    title: '操作',
    valueType: 'option',
    render: (text, row, _, action) => [
      <a
        key="editor"
        id="editor"
        onClick={() => {
          action.startEditable?.(row.id);
        }}
      >
        编辑
      </a>,
    ],
  },
];

const EditorProTableDemo = (
  props: {
    type?: 'multiple';
    defaultKeys?: React.Key[];
    editorRowKeys?: React.Key[];
    onEditorChange?: (editorRowKeys: React.Key[]) => void;
    dataSource?: DataSourceType[];
    onDataSourceChange?: (dataSource: DataSourceType[]) => void;
    position?: 'top';
  } & TableRowEditable<DataSourceType>,
) => {
  const actionRef = useRef<ActionType>();
  const [editableKeys, setEditorRowKeys] = useMergedState<React.Key[]>(
    () => props.defaultKeys || [],
    {
      value: props.editorRowKeys,
      onChange: props.onEditorChange,
    },
  );
  const [dataSource, setDataSource] = useMergedState<DataSourceType[]>([], {
    value: props.dataSource,
    onChange: props.onDataSourceChange,
  });
  return (
    <EditableProTable<DataSourceType>
      rowKey="id"
      toolBarRender={() => [
        <Button
          key="addEditRecord"
          id="addEditRecord"
          onClick={() => {
            actionRef.current?.addEditRecord(
              {
                id: 10000,
              },
              {
                position: props.position,
              },
            );
          }}
        >
          增加一行
        </Button>,
      ]}
      columns={columns}
      actionRef={actionRef}
      request={async () => ({
        data: defaultData,
        total: 3,
        success: true,
      })}
      value={dataSource}
      onChange={setDataSource}
      editable={{
        ...props,
        type: props.type,
        editableKeys,
        onSave: props.onSave,
        onChange: setEditorRowKeys,
      }}
    />
  );
};

describe('EditorProTable', () => {
  it('📝 EditableProTable support recordCreatorProps=false', async () => {
    const wrapper = render(
      <EditableProTable<DataSourceType>
        rowKey="id"
        recordCreatorProps={false}
        columns={columns}
        value={defaultData}
      />,
    );
    expect(wrapper).toMatchSnapshot();
  });

  it('📝 EditableProTable support recordCreatorProps', async () => {
    const wrapper = render(
      <EditableProTable<DataSourceType>
        rowKey="id"
        recordCreatorProps={{
          creatorButtonText: '测试添加数据',
          record: { id: 9999 },
          icon: 'qixian',
        }}
        columns={columns}
        value={defaultData}
      />,
    );
    expect(wrapper).toMatchSnapshot();
  });

  it('📝 EditableProTable support recordCreatorProps.position', async () => {
    const wrapper = render(
      <EditableProTable<DataSourceType>
        rowKey="id"
        recordCreatorProps={{
          creatorButtonText: '测试添加数据',
          record: { id: 9999 },
          icon: 'qixian',
          position: 'top',
        }}
        columns={columns}
        value={defaultData}
      />,
    );
    expect(wrapper).toMatchSnapshot();
  });

  it('📝 support onEditorChange', async () => {
    const fn = jest.fn();
    const wrapper = mount(
      <EditorProTableDemo
        onEditorChange={(keys) => {
          fn(keys);
        }}
      />,
    );
    await waitForComponentToPaint(wrapper, 1000);
    act(() => {
      wrapper.find('#editor').at(0).simulate('click');
    });

    expect(fn).toBeCalledWith([624748504]);
  });

  it('📝 renderFormItem run defaultRender', async () => {
    const wrapper = mount(
      <EditableProTable<DataSourceType>
        rowKey="id"
        editable={{
          editableKeys: [624748504],
        }}
        columns={[
          {
            dataIndex: 'index',
            valueType: 'indexBorder',
            width: 48,
            renderFormItem: (item, config) => {
              return config.defaultRender(item);
            },
          },
        ]}
        value={defaultData}
      />,
    );
    expect(wrapper.render()).toMatchSnapshot();
  });

  it('📝 columns support editable test', async () => {
    const wrapper = mount(
      <EditableProTable
        rowKey="id"
        editable={{
          editableKeys: [624748504],
        }}
        columns={[
          {
            dataIndex: 'index',
            valueType: 'indexBorder',
            width: 48,
            editable: (text, record, index) => {
              return index === 1;
            },
          },
          {
            dataIndex: 'index',
            valueType: 'indexBorder',
            width: 48,
            editable: false,
          },
        ]}
        value={defaultData}
      />,
    );
    expect(wrapper.render()).toMatchSnapshot();
  });

  it('📝 support editorRowKeys', async () => {
    const wrapper = mount(<EditorProTableDemo editorRowKeys={[624748504]} />);
    await waitForComponentToPaint(wrapper, 1000);
    // 第一行应该编辑态
    expect(
      wrapper.find('.ant-table-tbody tr.ant-table-row').at(0).find('input').exists(),
    ).toBeTruthy();

    // 第二行不应该是编辑态
    expect(
      wrapper.find('.ant-table-tbody tr.ant-table-row').at(1).find('input').exists(),
    ).toBeFalsy();
  });

  it('📝 support cancel click', async () => {
    const fn = jest.fn();
    const wrapper = mount(
      <EditorProTableDemo
        onEditorChange={(keys) => {
          fn(keys);
        }}
      />,
    );
    await waitForComponentToPaint(wrapper, 1000);
    act(() => {
      wrapper.find('#editor').at(0).simulate('click');
    });
    await waitForComponentToPaint(wrapper, 1000);
    expect(
      wrapper.find('.ant-table-tbody tr.ant-table-row').at(0).find('input').exists(),
    ).toBeTruthy();

    act(() => {
      wrapper.find('.ant-table-tbody tr.ant-table-row').at(0).find(`td a`).at(2).simulate('click');
    });

    await waitForComponentToPaint(wrapper, 1000);

    expect(
      wrapper.find('.ant-table-tbody tr.ant-table-row').at(0).find('input').exists(),
    ).toBeFalsy();
  });

  it('📝 support cancel click render false', async () => {
    const fn = jest.fn();
    const wrapper = mount(
      <EditorProTableDemo
        onEditorChange={(keys) => {
          fn(keys);
        }}
        onCancel={async () => false}
      />,
    );
    await waitForComponentToPaint(wrapper, 1000);
    act(() => {
      wrapper.find('#editor').at(0).simulate('click');
    });
    await waitForComponentToPaint(wrapper, 1000);
    expect(
      wrapper.find('.ant-table-tbody tr.ant-table-row').at(0).find('input').exists(),
    ).toBeTruthy();

    act(() => {
      wrapper.find('.ant-table-tbody tr.ant-table-row').at(0).find(`td a`).at(2).simulate('click');
    });

    await waitForComponentToPaint(wrapper, 1000);

    expect(
      wrapper.find('.ant-table-tbody tr.ant-table-row').at(0).find('input').exists(),
    ).toBeTruthy();
  });

  it('📝 type=single, only edit one rows', async () => {
    const fn = jest.fn();
    const wrapper = mount(
      <EditorProTableDemo
        defaultKeys={[624748504]}
        onEditorChange={(keys) => {
          fn(keys);
        }}
      />,
    );
    await waitForComponentToPaint(wrapper, 1000);
    act(() => {
      wrapper.find('#editor').at(0).simulate('click');
    });

    await waitForComponentToPaint(wrapper, 1000);

    expect(fn).not.toBeCalled();
  });

  it('📝 edit tree data table', async () => {
    const fn = jest.fn();
    const wrapper = mount(<EditorProTableDemo onSave={fn} dataSource={[defaultData[2]]} />);
    await waitForComponentToPaint(wrapper, 1000);
    act(() => {
      wrapper
        .find('.ant-table-tbody tr.ant-table-row')
        .at(0)
        .find('td button.ant-table-row-expand-icon')
        .simulate('click');
    });

    await waitForComponentToPaint(wrapper, 200);

    act(() => {
      wrapper.find('#editor').at(0).simulate('click');
    });

    await waitForComponentToPaint(wrapper, 1000);

    expect(
      wrapper.find('.ant-table-tbody tr.ant-table-row').at(0).find('input').exists(),
    ).toBeTruthy();

    act(() => {
      wrapper.find('.ant-table-tbody tr.ant-table-row').at(0).find('td a').at(0).simulate('click');
    });
    await waitForComponentToPaint(wrapper, 1000);
    expect(
      wrapper.find('.ant-table-tbody tr.ant-table-row').at(0).find('input').exists(),
    ).toBeFalsy();

    expect(fn).toBeCalled();
  });

  it('📝 type=multiple, edit multiple rows', async () => {
    const fn = jest.fn();
    const wrapper = mount(
      <EditorProTableDemo
        type="multiple"
        defaultKeys={[624748504]}
        onEditorChange={(keys) => {
          fn(keys);
        }}
      />,
    );
    await waitForComponentToPaint(wrapper, 1000);
    act(() => {
      wrapper.find('#editor').at(0).simulate('click');
    });
    await waitForComponentToPaint(wrapper, 1000);
    expect(fn).toBeCalledWith([624748504, 624691229]);
  });

  it('📝 support onSave', async () => {
    const fn = jest.fn();
    const wrapper = mount(<EditorProTableDemo onSave={(key) => fn(key)} />);
    await waitForComponentToPaint(wrapper, 1000);
    act(() => {
      wrapper.find('#editor').at(1).simulate('click');
    });

    await waitForComponentToPaint(wrapper, 200);

    expect(
      wrapper.find('.ant-table-tbody tr.ant-table-row').at(1).find('input').exists(),
    ).toBeTruthy();

    act(() => {
      wrapper.find('.ant-table-tbody tr.ant-table-row').at(1).find(`td a`).at(0).simulate('click');
    });

    await waitForComponentToPaint(wrapper, 200);

    expect(fn).toBeCalledWith(624691229);
  });

  it('📝 support onSave support false', async () => {
    const fn = jest.fn();
    const wrapper = mount(
      <EditorProTableDemo
        onSave={async (key) => {
          fn(key);
          return false;
        }}
      />,
    );
    await waitForComponentToPaint(wrapper, 1000);
    act(() => {
      wrapper.find('#editor').at(1).simulate('click');
    });

    await waitForComponentToPaint(wrapper, 200);

    expect(
      wrapper.find('.ant-table-tbody tr.ant-table-row').at(1).find('input').exists(),
    ).toBeTruthy();

    act(() => {
      wrapper.find('.ant-table-tbody tr.ant-table-row').at(1).find(`td a`).at(0).simulate('click');
    });

    await waitForComponentToPaint(wrapper, 200);

    expect(
      wrapper.find('.ant-table-tbody tr.ant-table-row').at(1).find('input').exists(),
    ).toBeTruthy();

    expect(fn).toBeCalledWith(624691229);
  });

  it('📝 support onCancel', async () => {
    const fn = jest.fn();
    const wrapper = mount(<EditorProTableDemo onCancel={(key) => fn(key)} />);
    await waitForComponentToPaint(wrapper, 1000);
    act(() => {
      wrapper.find('#editor').at(1).simulate('click');
    });

    await waitForComponentToPaint(wrapper, 200);

    expect(
      wrapper.find('.ant-table-tbody tr.ant-table-row').at(1).find('input').exists(),
    ).toBeTruthy();

    act(() => {
      wrapper.find('.ant-table-tbody tr.ant-table-row').at(1).find(`td a`).at(2).simulate('click');
    });

    await waitForComponentToPaint(wrapper, 200);

    expect(fn).toBeCalledWith(624691229);
  });

  it('📝 support onCancel support false', async () => {
    const fn = jest.fn();
    const wrapper = mount(
      <EditorProTableDemo
        onCancel={async (key) => {
          fn(key);
          return false;
        }}
      />,
    );
    await waitForComponentToPaint(wrapper, 1000);
    act(() => {
      wrapper.find('#editor').at(1).simulate('click');
    });

    await waitForComponentToPaint(wrapper, 200);

    expect(
      wrapper.find('.ant-table-tbody tr.ant-table-row').at(1).find('input').exists(),
    ).toBeTruthy();

    act(() => {
      wrapper.find('.ant-table-tbody tr.ant-table-row').at(1).find(`td a`).at(2).simulate('click');
    });

    await waitForComponentToPaint(wrapper, 200);

    expect(
      wrapper.find('.ant-table-tbody tr.ant-table-row').at(1).find('input').exists(),
    ).toBeTruthy();

    expect(fn).toBeCalledWith(624691229);
  });

  it('📝 onDelete auto close loading when error ', async () => {
    const wrapper = mount(
      <EditorProTableDemo
        onDelete={async () => {
          await waitTime(500);
          throw new Error('some time error');
        }}
      />,
    );
    await waitForComponentToPaint(wrapper, 1000);
    act(() => {
      wrapper.find('#editor').at(1).simulate('click');
    });

    await waitForComponentToPaint(wrapper, 200);

    expect(
      wrapper.find('.ant-table-tbody tr.ant-table-row').at(1).find('input').exists(),
    ).toBeTruthy();

    act(() => {
      wrapper.find('.ant-table-tbody tr.ant-table-row').at(1).find(`td a`).at(1).simulate('click');
    });

    await waitForComponentToPaint(wrapper, 200);
    act(() => {
      wrapper.find('.ant-popconfirm .ant-popover-buttons .ant-btn-primary').simulate('click');
    });

    await waitForComponentToPaint(wrapper, 1000);

    expect(wrapper.find('LoadingOutlined').exists()).toBeFalsy();
  });

  it('📝 support onDelete', async () => {
    const fn = jest.fn();
    const wrapper = mount(
      <EditorProTableDemo
        onDelete={async (key) => {
          await waitTime(500);
          fn(key);
          return false;
        }}
      />,
    );
    await waitForComponentToPaint(wrapper, 1000);
    act(() => {
      wrapper.find('#editor').at(1).simulate('click');
    });

    await waitForComponentToPaint(wrapper, 200);

    expect(
      wrapper.find('.ant-table-tbody tr.ant-table-row').at(1).find('input').exists(),
    ).toBeTruthy();

    act(() => {
      wrapper.find('.ant-table-tbody tr.ant-table-row').at(1).find(`td a`).at(1).simulate('click');
    });

    await waitForComponentToPaint(wrapper, 200);
    act(() => {
      wrapper.find('.ant-popconfirm .ant-popover-buttons .ant-btn-primary').simulate('click');
    });

    await waitForComponentToPaint(wrapper, 1000);

    expect(fn).toBeCalledWith(624691229);
    wrapper.unmount();
  });

  it('📝 support onDelete return false', async () => {
    const fn = jest.fn();
    const wrapper = mount(
      <EditorProTableDemo
        onDelete={async (key) => {
          await waitTime(500);
          fn(key);
        }}
      />,
    );
    await waitForComponentToPaint(wrapper, 1000);
    act(() => {
      wrapper.find('#editor').at(1).simulate('click');
    });

    await waitForComponentToPaint(wrapper, 200);

    expect(
      wrapper.find('.ant-table-tbody tr.ant-table-row').at(1).find('input').exists(),
    ).toBeTruthy();

    act(() => {
      wrapper.find('.ant-table-tbody tr.ant-table-row').at(1).find(`td a`).at(1).simulate('click');
    });

    await waitForComponentToPaint(wrapper, 200);
    act(() => {
      wrapper.find('.ant-popconfirm .ant-popover-buttons .ant-btn-primary').simulate('click');
    });

    await waitForComponentToPaint(wrapper, 1000);

    expect(fn).toBeCalledWith(624691229);
    wrapper.unmount();
  });

  it('📝 support form rules', async () => {
    const fn = jest.fn();
    const wrapper = mount(<EditorProTableDemo onSave={(key, row) => fn(row.title)} />);
    await waitForComponentToPaint(wrapper, 1000);

    act(() => {
      wrapper.find('#editor').at(1).simulate('click');
    });

    await waitForComponentToPaint(wrapper, 200);
    expect(
      wrapper.find('.ant-table-tbody tr.ant-table-row').at(1).find('input').exists(),
    ).toBeTruthy();

    act(() => {
      wrapper
        .find('.ant-table-tbody tr.ant-table-row')
        .at(1)
        .find(`td .ant-input`)
        .at(0)
        .simulate('change', {
          target: {
            value: '',
          },
        });
    });
    act(() => {
      wrapper.find('.ant-table-tbody tr.ant-table-row').at(1).find(`td a`).at(0).simulate('click');
    });

    await waitForComponentToPaint(wrapper, 200);

    // 没有通过验证，不触发 onSave
    expect(fn).not.toBeCalled();

    act(() => {
      wrapper
        .find('.ant-table-tbody tr.ant-table-row')
        .at(1)
        .find(`td .ant-input`)
        .at(0)
        .simulate('change', {
          target: {
            value: 'qixian',
          },
        });
    });

    act(() => {
      wrapper.find('.ant-table-tbody tr.ant-table-row').at(1).find(`td a`).at(0).simulate('click');
    });

    await waitForComponentToPaint(wrapper, 200);

    expect(fn).toBeCalledWith('qixian');
  });

  it('📝 support add line for start', async () => {
    const fn = jest.fn();
    const wrapper = mount(<EditorProTableDemo position="top" onSave={fn} />);
    await waitForComponentToPaint(wrapper, 1000);

    act(() => {
      wrapper.find('button#addEditRecord').simulate('click');
    });

    await waitForComponentToPaint(wrapper, 200);
    let editorRow = wrapper.find('.ant-table-tbody tr.ant-table-row').at(0);

    expect(editorRow.find('input').exists()).toBeTruthy();

    act(() => {
      editorRow.find(`td a`).at(1).simulate('click');
    });
    await waitForComponentToPaint(wrapper, 100);
    editorRow = wrapper.find('.ant-table-tbody tr.ant-table-row').at(0);

    expect(editorRow.find('input').exists()).toBeFalsy();

    act(() => {
      wrapper.find('button#addEditRecord').simulate('click');
    });

    await waitForComponentToPaint(wrapper, 200);

    act(() => {
      wrapper
        .find('.ant-table-tbody tr.ant-table-row')
        .at(0)
        .find(`td .ant-input`)
        .at(0)
        .simulate('change', {
          target: {
            value: 'qixian',
          },
        });
    });
    act(() => {
      wrapper.find('.ant-table-tbody tr.ant-table-row').at(0).find(`td a`).at(0).simulate('click');
    });
    await waitForComponentToPaint(wrapper, 200);
    expect(fn).toBeCalled();
  });

  it('📝 support add line for end', async () => {
    const fn = jest.fn();
    const wrapper = mount(<EditorProTableDemo onSave={fn} />);
    await waitForComponentToPaint(wrapper, 1000);

    act(() => {
      wrapper.find('button#addEditRecord').simulate('click');
    });

    await waitForComponentToPaint(wrapper, 200);

    act(() => {
      wrapper.find('button#addEditRecord').simulate('click');
    });

    let editorRow = wrapper.find('.ant-table-tbody tr.ant-table-row').at(3);

    expect(editorRow.find('input').exists()).toBeTruthy();

    act(() => {
      editorRow.find(`td a`).at(1).simulate('click');
    });
    await waitForComponentToPaint(wrapper, 100);
    editorRow = wrapper.find('.ant-table-tbody tr.ant-table-row').at(3);

    expect(editorRow.find('input').exists()).toBeFalsy();

    act(() => {
      wrapper.find('button#addEditRecord').simulate('click');
    });

    await waitForComponentToPaint(wrapper, 200);

    act(() => {
      wrapper
        .find('.ant-table-tbody tr.ant-table-row')
        .at(3)
        .find(`td .ant-input`)
        .at(0)
        .simulate('change', {
          target: {
            value: 'qixian',
          },
        });
    });
    act(() => {
      wrapper.find('.ant-table-tbody tr.ant-table-row').at(3).find(`td a`).at(0).simulate('click');
    });
    await waitForComponentToPaint(wrapper, 200);
    expect(fn).toBeCalled();
  });

  it('📝 support add line when single line edit', async () => {
    const wrapper = mount(<EditorProTableDemo editorRowKeys={[624748504]} />);
    await waitForComponentToPaint(wrapper, 1000);
    expect(
      wrapper.find('.ant-table-tbody tr.ant-table-row').at(0).find('input').exists(),
    ).toBeTruthy();

    act(() => {
      wrapper.find('button#addEditRecord').simulate('click');
    });

    await waitForComponentToPaint(wrapper, 100);

    act(() => {
      wrapper.find('button#addEditRecord').simulate('click');
    });

    await waitForComponentToPaint(wrapper, 100);

    const editorRow = wrapper.find('.ant-table-tbody tr.ant-table-row').at(3);

    expect(editorRow.find('input').exists()).toBeFalsy();
  });
});
