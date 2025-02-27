import React from 'react';
import './index.less';

export interface ProCardActionsProps {
  /**
   * @description 自定义前缀
   * @ignore
   */
  prefixCls?: string;
  /**
   * 操作按钮
   */
  actions?: React.ReactNode[];
}

const ProCardActions: React.FC<ProCardActionsProps> = (props) => {
  const { actions, prefixCls } = props;

  return actions && actions.length ? (
    <ul className={`${prefixCls}-actions`}>
      {actions.map((action, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <li style={{ width: `${100 / actions.length}%` }} key={`action-${index}`}>
          <span>{action}</span>
        </li>
      ))}
    </ul>
  ) : null;
};

export default ProCardActions;
