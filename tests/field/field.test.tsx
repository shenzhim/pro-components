import { render, mount } from 'enzyme';
import { Button, Input } from 'antd';
import React from 'react';
import moment from 'moment';
import { act } from 'react-test-renderer';
import Field from '@ant-design/pro-field';

import Demo from './fixtures/demo';
import { waitForComponentToPaint, waitTime } from '../util';

describe('Field', () => {
  it('🐴 base use', async () => {
    const html = render(<Field text="100" valueType="money" mode="edit" />);
    expect(html).toMatchSnapshot();
  });

  it('🐴 percent=0', async () => {
    const html = render(
      <Field
        text={0}
        valueType={{
          type: 'percent',
          showSymbol: true,
          showColor: true,
        }}
        mode="read"
      />,
    );
    expect(html).toMatchSnapshot();
  });

  it('🐴 render 关闭 when text=0', async () => {
    const html = render(
      <Field
        text={0}
        mode="read"
        valueEnum={{
          0: { text: '关闭', status: 'Default' },
          1: { text: '运行中', status: 'Processing' },
          2: { text: '已上线', status: 'Success' },
          3: { text: '异常', status: 'Error' },
        }}
      />,
    );
    expect(html.text()).toBe('关闭');
  });

  it('🐴 render select form option', async () => {
    const html = render(
      <Field
        text="default"
        valueType="select"
        mode="read"
        fieldProps={{
          options: [
            { label: '关闭', value: 'default' },
            { label: '运行中', value: 'processing' },
            { label: '已上线', value: 'success' },
            { label: '异常', value: 'error' },
          ],
        }}
      />,
    );
    expect(html.text()).toBe('关闭');
  });

  it(`🐴 select valueEnum key is undefined`, async () => {
    const html = render(
      <Field
        text="default"
        valueType="select"
        mode="read"
        valueEnum={{
          default: undefined,
          processing: { text: '运行中', status: 'Processing' },
          success: { text: '已上线', status: 'Success' },
          error: { text: '异常', status: 'Error' },
        }}
      />,
    );

    expect(html.text()).toBe('default');
  });

  ['select', 'checkbox', 'radio', 'radioButton'].forEach((valueType) => {
    it(`🐴 ${valueType} support render function`, async () => {
      const html = render(
        <Field
          text="default"
          valueType={valueType as 'radio'}
          mode="read"
          render={(text, _, dom) => <>pre{dom}</>}
          valueEnum={{
            default: { text: '关闭', status: 'Default' },
            processing: { text: '运行中', status: 'Processing' },
            success: { text: '已上线', status: 'Success' },
            error: { text: '异常', status: 'Error' },
          }}
        />,
      );
      expect(html.text()).toBe('pre关闭');
    });

    it(`🐴 ${valueType} support request function`, async () => {
      const ref = React.createRef<{
        fetchData: () => void;
      }>();
      const fn = jest.fn();
      const html = mount(
        <Field
          ref={ref}
          text="default"
          proFieldKey={valueType}
          valueType={valueType as 'radio'}
          mode="read"
          request={async () => {
            fn();
            return [
              { label: '全部', value: 'all' },
              { label: '未解决', value: 'open' },
              { label: '已解决', value: 'closed' },
              { label: '解决中', value: 'processing' },
            ];
          }}
        />,
      );

      await waitForComponentToPaint(html);
      ref.current?.fetchData();
      await waitForComponentToPaint(html);
      expect(fn).toBeCalledTimes(2);
      html.unmount();
    });

    it(`🐴 ${valueType} support renderFormItem function`, async () => {
      const html = mount(
        <Field
          text="default"
          valueType={valueType as 'radio'}
          mode="edit"
          renderFormItem={() => <Input id="select" />}
          valueEnum={{
            0: { text: '关闭', status: 'Default' },
            1: { text: '运行中', status: 'Processing' },
            2: { text: '已上线', status: 'Success' },
            3: { text: '异常', status: 'Error' },
          }}
        />,
      );
      expect(html.find('#select').exists()).toBeTruthy();
    });

    it('🐴 select mode=null', async () => {
      const html = render(
        <Field
          text="default"
          valueType={valueType as 'radio'}
          // @ts-expect-error
          mode="test"
          valueEnum={{
            0: { text: '关闭', status: 'Default' },
            1: { text: '运行中', status: 'Processing' },
            2: { text: '已上线', status: 'Success' },
            3: { text: '异常', status: 'Error' },
          }}
        />,
      );
      expect(html.text()).toBeFalsy();
    });

    it('🐴 select request loading', async () => {
      const html = render(
        <Field
          text="default"
          valueType={valueType as 'radio'}
          mode="read"
          request={async () => {
            await waitTime(10000);
            return [
              { label: '全部', value: 'all' },
              { label: '未解决', value: 'open' },
              { label: '已解决', value: 'closed' },
              { label: '解决中', value: 'processing' },
            ];
          }}
        />,
      );
      expect(html.text()).toBe('default');
    });

    it('🐴 select request loading', async () => {
      const html = render(
        <Field text="default" valueType={valueType as 'radio'} mode="read" options={[]} />,
      );
      expect(html.text()).toBe('default');
    });
  });

  it('🐴 select valueEnum and request=null ', async () => {
    const html = render(<Field text="default" valueType="select" mode="read" />);
    expect(html.text()).toBe('default');
  });

  it('🐴 select text=null & valueEnum & request=null ', async () => {
    const html = render(<Field text={null} valueType="select" mode="read" />);
    expect(html.text()).toBe('-');
  });

  it('🐴 select text=null & valueEnum=null ', async () => {
    const html = render(
      <Field
        text={null}
        // @ts-expect-error
        valueEnum={null}
        valueType="select"
        mode="read"
      />,
    );
    expect(html.text()).toBe('-');
  });

  it('🐴 select options should change text', async () => {
    const html = mount(
      <Field
        text="all"
        fieldProps={{
          options: [
            { label: '全部', value: 'all' },
            { label: '未解决', value: 'open' },
            { label: '已解决', value: 'closed' },
            { label: '解决中', value: 'processing' },
          ],
        }}
        valueType="select"
        mode="read"
      />,
    );
    expect(html.text()).toBe('全部');

    act(() => {
      html.setProps({
        fieldProps: { options: [] },
      });
    });

    await waitForComponentToPaint(html, 100);

    expect(html.text()).toBe('all');
  });

  it('🐴 edit and no plain', async () => {
    const html = render(<Demo plain={false} state="edit" />);
    expect(html).toMatchSnapshot();
  });

  it('🐴 edit and plain', async () => {
    const html = render(<Demo plain state="edit" />);
    expect(html).toMatchSnapshot();
  });

  it('🐴 read and plain', async () => {
    const html = render(<Demo plain state="read" />);
    expect(html).toMatchSnapshot();
  });

  it('🐴 read ant no plain', async () => {
    const html = render(<Demo plain={false} state="read" />);
    expect(html).toMatchSnapshot();
  });

  const valueTypes = [
    'password',
    'money',
    'textarea',
    'date',
    'fromNow',
    'dateRange',
    'dateTimeRange',
    'dateTime',
    'time',
    'switch',
    'text',
    'progress',
    'percent',
    'digit',
    'second',
    'code',
    'jsonCode',
    'rate',
  ];
  valueTypes.forEach((valueType) => {
    it(`🐴 valueType support render ${valueType}`, async () => {
      const html = render(
        <Field
          text="1994-07-29 12:00:00"
          mode="read"
          valueType={valueType as 'text'}
          render={() => <>qixian</>}
        />,
      );
      expect(html.text()).toBe('qixian');
    });

    it(`🐴 valueType renderFormItem ${valueType}`, async () => {
      if (valueType === 'option') return;
      const html = render(
        <Field
          text={moment('2019-11-16 12:50:26').valueOf()}
          mode="edit"
          valueType={valueType as 'text'}
          renderFormItem={() => <>qixian</>}
        />,
      );
      expect(html.text()).toBe('qixian');
    });

    it(`🐴 ${valueType} mode="error"`, async () => {
      if (valueType === 'option') return;
      const html = render(
        <Field
          text="'2019-11-16 12:50:26'"
          // @ts-expect-error
          mode="error"
          valueType={valueType as 'text'}
        />,
      );
      expect(html.text()).toBeFalsy();
    });

    it(`🐴 valueType render ${valueType} when text is null`, async () => {
      const html = render(
        <Field
          text={null}
          // @ts-ignore
          valueType={valueType}
        />,
      );
      expect(html.text()).toBe('-');
    });

    it(`🐴 valueType support render ${valueType} when text is null`, async () => {
      const html = render(
        <Field
          text={null}
          render={() => <>qixian</>}
          // @ts-ignore
          valueType={valueType}
        />,
      );
      expect(html.text()).toBe('qixian');
    });
  });

  it('🐴 money valueType is Object', async () => {
    let html = render(
      <Field
        text="100"
        valueType={{
          type: 'money',
          locale: 'en_US',
        }}
        mode="edit"
      />,
    );
    expect(html).toMatchSnapshot();

    html = render(
      <Field
        text="100"
        valueType={{
          type: 'money',
          locale: 'en_US',
        }}
        mode="read"
      />,
    );
    expect(html).toMatchSnapshot();
  });

  it('🐴 percent valueType is Object', async () => {
    let html = render(
      <Field
        text="100"
        valueType={{
          type: 'percent',
          showSymbol: true,
        }}
        mode="edit"
      />,
    );
    expect(html).toMatchSnapshot();

    html = render(
      <Field
        text="100"
        valueType={{
          type: 'percent',
          showSymbol: true,
        }}
        showColor
        mode="read"
      />,
    );
    expect(html.text()).toBe('+ 100.00%');

    html = render(
      <Field
        text="100"
        valueType={{
          type: 'percent',
          showSymbol: true,
          precision: 1,
        }}
        mode="read"
      />,
    );
    expect(html.text()).toBe('+ 100.0%');

    html = render(
      <Field
        text={-100}
        valueType={{
          type: 'percent',
          showSymbol: true,
          precision: 1,
        }}
        showColor
        mode="read"
      />,
    );
    expect(html.text()).toBe('- 100.0%');
  });

  it('🐴 password support visible', () => {
    const html = mount(<Field text={123456} valueType="password" mode="read" />);
    act(() => {
      html.find('span.anticon-eye-invisible').simulate('click');
    });
    expect(html.find('span.anticon-eye').exists()).toBeTruthy();
  });

  it('🐴 password support controlled visible', () => {
    const fn = jest.fn();
    const html = mount(
      <Field
        text={123456}
        onVisible={(visible) => fn(visible)}
        visible
        valueType="password"
        mode="read"
      />,
    );
    act(() => {
      html.find('span.anticon-eye').simulate('click');
    });
    expect(html.find('span.anticon-eye-invisible').exists()).toBeFalsy();
    expect(fn).toBeCalledWith(false);
  });

  it('🐴 options support empty dom', () => {
    const html = mount(
      <Field
        // @ts-expect-error
        render={() => []}
        text={[]}
        valueType="option"
        mode="read"
      />,
    );
    expect(html.render()).toMatchSnapshot();
  });

  it('🐴 options support dom list', () => {
    const html = mount(
      <Field
        text={[<Button key="add">新建</Button>, <Button key="edit">修改</Button>]}
        valueType="option"
        mode="read"
      />,
    );
    expect(html.render()).toMatchSnapshot();
  });

  it('🐴 options support one dom', () => {
    const html = mount(
      <Field text={[<Button key="add">新建</Button>]} valueType="option" mode="read" />,
    );
    expect(html.render()).toMatchSnapshot();
  });

  it('🐴 progress support string number', () => {
    const html = mount(<Field text="12" valueType="progress" mode="read" />);
    expect(html.render()).toMatchSnapshot();
  });

  it('🐴 progress support no number', () => {
    const html = mount(<Field text="qixian" valueType="progress" mode="read" />);
    expect(html.render()).toMatchSnapshot();
  });

  it('🐴 valueType={}', () => {
    const html = mount(
      <Field
        text="qixian"
        // @ts-expect-error
        valueType={{}}
        mode="read"
      />,
    );
    expect(html.text()).toBe('qixian');
  });

  it('🐴 keypress simulate', () => {
    const html = mount(<Field text="qixian" valueType="textarea" mode="edit" />);
    act(() => {
      html.find('TextArea').at(0).simulate('keypress', {
        key: 'Enter',
        keyCode: 13,
      });
    });
    act(() => {
      html.setProps({
        mode: 'read',
      });
    });
    expect(html.text()).toBe('qixian');
  });
});
