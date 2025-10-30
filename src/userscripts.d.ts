export declare global {
  let unsafeWindow: UnsafeWindow;

  function GM_setValue(key: string, value: any): void;
  function GM_getValue(key: string, defaultValue?: any): any;
  function GM_deleteValue(key: string): void;
  function GM_addStyle(css: string): void;
}
