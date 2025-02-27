import { MenuTheme } from 'antd/es/menu/MenuContext';

export type ContentWidth = 'Fluid' | 'Fixed';

export interface RenderSetting {
  headerRender?: false;
  footerRender?: false;
  menuRender?: false;
  menuHeaderRender?: false;
}
export interface PureSettings {
  /**
   * @name theme for nav menu
   */
  navTheme?: MenuTheme | 'realDark' | undefined;

  /**
   * @name 顶部菜单的颜色，mix 模式下生效
   */
  headerTheme?: MenuTheme;
  /**
   * @name nav menu position: `side` or `top`
   */
  headerHeight?: number;
  /**
   * @name customize header height
   */
  layout?: 'side' | 'top' | 'mix';
  /**
   * @name layout of content: `Fluid` or `Fixed`, only works when layout is top
   */
  contentWidth?: ContentWidth;
  /**
   * @name sticky header
   */
  fixedHeader?: boolean;
  /**
   * @name sticky siderbar
   */
  fixSiderbar?: boolean;
  /**
   * @name menu 相关的一些配置
   */
  menu?: { locale?: boolean; defaultOpenAll?: boolean; loading?: boolean };
  /**
   * @name Layout 的 title，也会显示在浏览器标签上
   * @description 设置为 false，在 layout 中只展示 pageName，而不是 pageName - title
   */
  title: string | false;
  /**
   * Your custom iconfont Symbol script Url
   * eg：//at.alicdn.com/t/font_1039637_btcrd5co4w.js
   * 注意：如果需要图标多色，Iconfont 图标项目里要进行批量去色处理
   * Usage: https://github.com/ant-design/ant-design-pro/pull/3517
   */
  iconfontUrl?: string;
  /**
   * @name 主色，需要配合 umi 使用
   */
  primaryColor?: string;
  /**
   * @name 全局增加滤镜
   */
  colorWeak?: boolean;
  /**
   * @name 切割菜单
   * @description 只在 mix 模式下生效
   */
  splitMenus?: boolean;
}

export type ProSettings = PureSettings & RenderSetting;

const defaultSettings: ProSettings = {
  navTheme: 'dark',
  layout: 'side',
  contentWidth: 'Fluid',
  fixedHeader: false,
  fixSiderbar: false,
  menu: {
    locale: true,
  },
  headerHeight: 48,
  title: 'Ant Design Pro',
  iconfontUrl: '',
  primaryColor: '#1890ff',
};
export default defaultSettings;
