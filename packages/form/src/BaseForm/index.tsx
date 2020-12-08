import React, { ReactElement, useRef, useState } from 'react';
import { Form } from 'antd';
import { FormProps, FormInstance } from 'antd/lib/form/Form';
import { FormItemProps } from 'antd/lib/form';
import { ConfigProviderWrap } from '@ant-design/pro-provider';
import {
  conversionSubmitValue,
  SearchTransformKeyFn,
  transformKeySubmitValue,
} from '@ant-design/pro-utils';
import { ProFieldValueType } from '@ant-design/pro-field';
import SizeContext from 'antd/lib/config-provider/SizeContext';
import { Store } from 'antd/lib/form/interface';
import namePathSet from 'rc-util/lib/utils/set';
import { ButtonProps } from 'antd/lib/button';
import FieldContext from '../FieldContext';
import Submitter, { SubmitterProps } from '../components/Submitter';
import { GroupProps, FieldProps } from '../interface';

export interface CommonFormProps {
  submitter?:
    | SubmitterProps<{
        form?: FormInstance<any>;
      }>
    | false;

  /**
   * @name 表单结束后调用
   * @description  支持异步操作，更加方便
   */
  onFinish?: (formData: Store) => Promise<boolean | void>;

  /**
   * @name 获取真正的可以获得值的 from
   */
  formRef?: React.MutableRefObject<FormInstance | undefined>;
}

export interface BaseFormProps extends FormProps, CommonFormProps {
  contentRender?: (
    items: React.ReactNode[],
    submitter: ReactElement<SubmitterProps> | undefined,
    form: FormInstance<any>,
  ) => React.ReactNode;
  fieldProps?: FieldProps;
  dateFormatter?: 'number' | 'string' | false;
  formItemProps?: FormItemProps;
  groupProps?: GroupProps;
  /**
   * @name 表单结束后调用
   * @description  支持异步操作，更加方便
   */
  onFinish?: (formData: Store) => Promise<boolean | void>;
}

const BaseForm: React.FC<BaseFormProps> = (props) => {
  const {
    children,
    contentRender,
    submitter,
    fieldProps,
    formItemProps,
    groupProps,
    dateFormatter = 'string',
    form: userForm,
    formRef: propsFormRef,
    ...rest
  } = props;

  const [form] = Form.useForm();
  const formRef = useRef<FormInstance>(userForm || form);
  const fieldsValueType = useRef<{
    [key: string]: ProFieldValueType;
  }>({});
  /**
   * 保存 transformKeyRef，用于对表单key transform
   */
  const transformKeyRef = useRef<{
    [key: string]: SearchTransformKeyFn | undefined;
  }>({});

  const [loading, setLoading] = useState<ButtonProps['loading']>(false);

  /**
   * 因为 protable 里面的值无法保证刚开始就存在
   * 所以多进行了一次触发，这样可以解决部分问题
   */
  const [, updateState] = useState(false);

  const items = React.Children.toArray(children);
  const submitterProps: SubmitterProps =
    typeof submitter === 'boolean' || !submitter ? {} : submitter;

  /**
   * 渲染提交按钮与重置按钮
   */
  const submitterNode =
    submitter === false ? undefined : (
      <Submitter
        key="submitter"
        {...submitterProps}
        form={userForm || form}
        submitButtonProps={{
          loading,
          ...submitterProps.submitButtonProps,
        }}
      />
    );

  const content = contentRender ? contentRender(items, submitterNode, formRef.current) : items;

  const forgetUpdate = () => {
    setTimeout(() => updateState(true));
  };

  return (
    // 增加国际化的能力，与 table 组件可以统一
    <ConfigProviderWrap>
      <FieldContext.Provider
        value={{
          fieldProps,
          formItemProps,
          groupProps,
          setFieldValueType: (name, { valueType = 'text', transform }) => {
            if (Array.isArray(name)) {
              transformKeyRef.current = namePathSet(transformKeyRef.current, name, transform);
              fieldsValueType.current = namePathSet(fieldsValueType.current, name, valueType);
            } else {
              fieldsValueType.current[String(name)] = valueType;
              transformKeyRef.current[String(name)] = transform;
            }
          },
        }}
      >
        <SizeContext.Provider value={rest.size}>
          <Form
            onKeyPress={(event) => {
              if (event.key === 'Enter') {
                formRef.current?.submit();
              }
            }}
            form={userForm || form}
            {...rest}
            onFinish={async (values) => {
              if (!rest.onFinish) {
                return;
              }
              setLoading({
                delay: 100,
              });
              await rest.onFinish(
                transformKeySubmitValue(
                  conversionSubmitValue(values, dateFormatter, fieldsValueType.current),
                  transformKeyRef.current,
                ),
              );
              setLoading(false);
            }}
          >
            <input
              type="text"
              style={{
                display: 'none',
              }}
            />
            <Form.Item noStyle shouldUpdate>
              {(formInstance) => {
                // 支持 fromRef，这里 ref 里面可以随时拿到最新的值
                if (propsFormRef && !propsFormRef.current) forgetUpdate();
                if (propsFormRef) propsFormRef.current = formInstance as FormInstance;
                formRef.current = formInstance as FormInstance;
              }}
            </Form.Item>
            {content}
          </Form>
        </SizeContext.Provider>
      </FieldContext.Provider>
    </ConfigProviderWrap>
  );
};

export default BaseForm;
