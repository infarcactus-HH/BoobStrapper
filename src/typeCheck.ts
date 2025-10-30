export function isRegisterGroupType(
  obj: any
): obj is { key: string; name: string } {
  return obj.key && obj.name;
}

export function isRegisterModuleType(obj: any): obj is moduleType {
  return (
    obj.group &&
    obj.configSchema &&
    obj.configSchema.baseKey &&
    obj.configSchema.label &&
    obj.configSchema.default !== undefined &&
    obj.run !== undefined
  );
}

export type moduleType = {
  group: string;
  configSchema: {
    baseKey: string;
    label: string;
    default: boolean;
    subSettings?: {
      key: string;
      default: boolean;
      label: string;
    }[];
  };
  run(settings?: Record<string, boolean>): void;
};
