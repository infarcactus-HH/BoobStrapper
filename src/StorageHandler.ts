export default class StorageHandler {
    static getConfigValue(key:string, defaultValue : boolean): boolean {
        return GM_getValue(key, defaultValue);
    }
    static setConfigValue(key:string, value: boolean): void {
        GM_setValue(key, value);
    }
    static getConfigModuleKey(groupKey: string,moduleKey: string): string {
        return `${groupKey}_${moduleKey}`;
    }
    static getConfigSubSettingKey(groupKey: string,moduleKey: string, subSettingKey: string): string {
        return `${groupKey}_${moduleKey}_${subSettingKey}`;
    }
}