export type RegisterGroupType = {
  key: string;
  name: string;
};

export type ModuleConfigSubSetting = {
  key: string;
  default: boolean;
  label: string;
};

export type ModuleConfigSchema = {
  baseKey: string;
  label: string;
  default: boolean;
  subSettings?: ModuleConfigSubSetting[];
};

export type moduleBDSMType = {
  group: string;
  configSchema: ModuleConfigSchema;
  run(settings?: Record<string, boolean>): void;
};

function isUnknownObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isRegisterGroupType(
  object: unknown
): object is RegisterGroupType {
  return (
    isUnknownObject(object) &&
    typeof object.key === "string" &&
    object.key.length > 0 &&
    typeof object.name === "string" &&
    object.name.length > 0
  );
}

function isModuleConfigSubSetting(
  value: unknown
): value is ModuleConfigSubSetting {
  return (
    isUnknownObject(value) &&
    typeof value.key === "string" &&
    typeof value.label === "string" &&
    typeof value.default === "boolean"
  );
}

function isModuleConfigSchema(value: unknown): value is ModuleConfigSchema {
  return (
    isUnknownObject(value) &&
    typeof value.baseKey === "string" &&
    typeof value.label === "string" &&
    typeof value.default === "boolean" &&
    (value.subSettings === undefined ||
      (Array.isArray(value.subSettings) &&
        value.subSettings.every(isModuleConfigSubSetting)))
  );
}

export function isRegisterModuleType(object: unknown): object is moduleBDSMType {
  return (
    isUnknownObject(object) &&
    typeof object.group === "string" &&
    isModuleConfigSchema(object.configSchema) &&
    typeof object.run === "function"
  );
}
