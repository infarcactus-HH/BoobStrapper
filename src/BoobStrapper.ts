import StorageHandler from "./StorageHandler";
import {
  isRegisterGroupType,
  isRegisterModuleType,
  type moduleBDSMType,
  type RegisterGroupType,
} from "./typeCheck";
import HomeCss from "./css/Home.css";
import Helpers from "./Helpers";
import cssBaseVars from "./css/addBaseVars";
import cssConfigPannel from "./css/ConfigPannel.css";

type ModuleSettingsSnapshot = {
  enabled: boolean;
  subSettings: Record<string, boolean>;
};

export default class BoobStrapper {
  constructor() {
    unsafeWindow.BoobStrapperConfig = {
      registerGroup: this.registerGroup.bind(this),
      registerModule: this.registerModule.bind(this),
      runModules: this.runModules.bind(this),
      getModuleSettings: this.getModuleSettings.bind(this),
      getAllSettings: this.getAllSettings.bind(this),
    };
    unsafeWindow.BoobStrapper = {
      Helpers: {
        doWhenSelectorAvailable: Helpers.doWhenSelectorAvailable,
      },
    };
    if (location.pathname === "/home.html") {
      this.addConfigToggles();
    }
    $(document).trigger("boobstrapper:loaded");
  }
  private groups = new Map<string, RegisterGroupType>();
  private modules = new Map<string, moduleBDSMType>();
  private modulesByGroup = new Map<string, moduleBDSMType[]>();
  private config = new Map<string, boolean>();
  $settingsButton: JQuery<HTMLElement> | null = null;
  $configPannel: JQuery<HTMLElement> | null = null;

  registerGroup(group: unknown) {
    if (!isRegisterGroupType(group)) {
      throw new Error("Invalid group");
    }
    if (this.groups.has(group.key)) {
      console.warn(`Group with key ${group.key} is already registered.`);
      return;
    }
    this.groups.set(group.key, group);
  }
  registerModule(module: unknown) {
    if (!isRegisterModuleType(module)) {
      throw new Error("Invalid module");
    }
    const group = this.groups.get(module.group);
    if (!group) {
      throw new Error(`Group with key ${module.group} is not registered.`);
    }
    const moduleIdentifier = this.getModuleIdentifier(
      module.group,
      module.configSchema.baseKey
    );
    if (this.modules.has(moduleIdentifier)) {
      console.warn(
        `Module ${module.group}/${module.configSchema.baseKey} is already registered.`
      );
      return;
    }
    this.modules.set(moduleIdentifier, module);
    const modulesInGroup = this.modulesByGroup.get(group.key) ?? [];
    modulesInGroup.push(module);
    this.modulesByGroup.set(group.key, modulesInGroup);

    const moduleStorageKey = this.getModuleStorageKey(
      module.group,
      module.configSchema.baseKey
    );
    this.getConfigValue(moduleStorageKey, module.configSchema.default);

    if (!module.configSchema.subSettings) {
      return;
    }

    for (const subSetting of module.configSchema.subSettings) {
      const subSettingStorageKey = this.getSubSettingStorageKey(
        module.group,
        module.configSchema.baseKey,
        subSetting.key
      );
      this.getConfigValue(subSettingStorageKey, subSetting.default);
    }
  }
  runModules() {
    for (const module of this.modules.values()) {
      const moduleSettings = this.getModuleSettings(
        module.group,
        module.configSchema.baseKey
      );
      if (!moduleSettings?.enabled) {
        continue;
      }
      try {
        module.run(moduleSettings.subSettings);
      } catch (e) {
        console.error(
          `Error running module ${module.configSchema.baseKey}:`,
          e
        );
      }
    }
  }
  getModuleSettings(
    groupKey: string,
    baseModuleKey: string
  ): ModuleSettingsSnapshot | null {
    const moduleIdentifier = this.getModuleIdentifier(groupKey, baseModuleKey);
    const module = this.modules.get(moduleIdentifier);
    if (!module) {
      console.warn(
        `Module ${groupKey}/${baseModuleKey} was requested but is not registered.`
      );
      return null;
    }
    const moduleStorageKey = this.getModuleStorageKey(groupKey, baseModuleKey);
    const enabled = this.getConfigValue(
      moduleStorageKey,
      module.configSchema.default
    );
    const subSettings: Record<string, boolean> = {};
    for (const subSetting of module.configSchema.subSettings ?? []) {
      const subSettingStorageKey = this.getSubSettingStorageKey(
        groupKey,
        baseModuleKey,
        subSetting.key
      );
      subSettings[subSetting.key] = this.getConfigValue(
        subSettingStorageKey,
        subSetting.default
      );
    }
    return {
      enabled,
      subSettings,
    };
  }

  getAllSettings(): Record<string, Record<string, ModuleSettingsSnapshot>> {
    const snapshot: Record<string, Record<string, ModuleSettingsSnapshot>> = {};
    for (const [groupKey, modules] of this.modulesByGroup.entries()) {
      snapshot[groupKey] = {};
      for (const module of modules) {
        const settings = this.getModuleSettings(
          module.group,
          module.configSchema.baseKey
        );
        if (!settings) {
          continue;
        }
        snapshot[groupKey][module.configSchema.baseKey] = {
          enabled: settings.enabled,
          subSettings: { ...settings.subSettings },
        };
      }
    }
    return snapshot;
  }

  private getModuleIdentifier(groupKey: string, baseModuleKey: string): string {
    return `${groupKey}::${baseModuleKey}`;
  }

  private getModuleStorageKey(groupKey: string, baseModuleKey: string): string {
    return StorageHandler.getConfigModuleKey(groupKey, baseModuleKey);
  }

  private getSubSettingStorageKey(
    groupKey: string,
    baseModuleKey: string,
    subSettingKey: string
  ): string {
    return StorageHandler.getConfigSubSettingKey(
      groupKey,
      baseModuleKey,
      subSettingKey
    );
  }

  private getConfigValue(storageKey: string, fallback: boolean): boolean {
    if (this.config.has(storageKey)) {
      return this.config.get(storageKey)!;
    }
    const value = StorageHandler.getConfigValue(storageKey, fallback);
    this.config.set(storageKey, value);
    return value;
  }

  private updateConfigValue(storageKey: string, value: boolean): void {
    this.config.set(storageKey, value);
    StorageHandler.setConfigValue(storageKey, value);
  }
  addConfigToggles() {
    addHomeStyles();
    console.log("Adding config button");
    this.$settingsButton = $(
      `<div class="hh-plus-plus-config-button boob-strapped" hh_title="BoobStrapper" tooltip></div>`
    ).on("click", () => {
      console.log("Config button clicked");
      this.generateConfigPannel();
    });
    //$("#contains_all").append($settingsButton);
    Helpers.doWhenSelectorAvailable("#contains_all", ($container) => {
      if (!this.$settingsButton) return;
      $container.append(this.$settingsButton);
    });
    async function addHomeStyles() {
      cssBaseVars.run();
      GM_addStyle(HomeCss);
    }
  }
  generateConfigPannel() {
    if (this.$configPannel && !this.$configPannel.hasClass("shown")) {
      this.$configPannel.addClass("shown");
      return;
    }
    if (!this.$settingsButton || this.$configPannel) {
      return;
    }
    addConfigPannelStyles();
    this.$configPannel = $(
      `<div class="hh-plus-plus-config-panel boob-strapper shown">`
    );
    this.$settingsButton.after(this.$configPannel);
    const $closeButton = $(`<span class="close-config-panel"></span>`).on(
      "click",
      () => {
        this.$configPannel?.removeClass("shown");
      }
    );
    this.$configPannel.append($closeButton);
    const $tabContainer = $(`<div class="tabs boob-strapper hh-scroll"></div>`);
    this.$configPannel.append($tabContainer);
    for (const group of this.groups.values()) {
      const groupKey = group.key;
      const $groupTab = $(
        `<h4 class="${groupKey}" rel="${groupKey}">${group.name}</div>`
      ).on("click", () => {
        $groupTab.siblings().removeClass("selected");
        $groupTab.addClass("selected");
        this.$configPannel
          ?.find(".group-panel")
          .removeClass("shown")
          .filter(`.group-panel[rel="${groupKey}"]`)
          .addClass("shown");
      });
      $tabContainer.append($groupTab);
      const $groupContainer = $(
        `<div class="group-panel" rel="${groupKey}"></div>`
      );
      this.$configPannel.append($groupContainer);
      const $panelContent = $(`<div class="panel-contents hh-scroll"></div>`);
      $groupContainer.append($panelContent);
      const modulesInGroup = this.modulesByGroup.get(groupKey) ?? [];
      for (const module of modulesInGroup) {
        const moduleKey = this.getModuleStorageKey(
          module.group,
          module.configSchema.baseKey
        );
        const moduleSettings = this.getModuleSettings(
          module.group,
          module.configSchema.baseKey
        );
        if (!moduleSettings) {
          continue;
        }
        const baseModuleEnabled = moduleSettings.enabled;
        const $moduleToggleContainer = $(
          `<div class="config-setting ${baseModuleEnabled ? "enabled" : ""} ${
            module.configSchema.subSettings ? "has-subsettings" : ""
          }" rel="${moduleKey}"></div>`
        );
        const $moduleToggle = $(
          `<label class="base-setting">
            <span>${module.configSchema.label}</span>
            <input type="checkbox" name="${moduleKey}" ${
            baseModuleEnabled ? 'checked="checked"' : ""
          }>
          </label>`
        );
        $moduleToggleContainer.append($moduleToggle);
        if (module.configSchema.subSettings) {
          const $subSettingsContainer = $(`<div class="sub-settings"></div>`);
          for (const subSetting of module.configSchema.subSettings) {
            const subSettingKey = this.getSubSettingStorageKey(
              module.group,
              module.configSchema.baseKey,
              subSetting.key
            );
            const subSettingEnabled =
              moduleSettings.subSettings[subSetting.key];
            $subSettingsContainer.append(
              `<label><input type="checkbox" name="${subSettingKey}" ${
                subSettingEnabled ? 'checked="checked"' : ""
              } ${baseModuleEnabled ? "" : "disabled"}><span>${
                subSetting.label
              }</span></label>`
            );
          }
          $moduleToggleContainer.append($subSettingsContainer);
        }
        $panelContent.append($moduleToggleContainer);
      }
    }
    this.$configPannel.on(
      "change",
      '.config-setting input[type="checkbox"]',
      (event) => {
        const $target = $(event.target);
        console.log("Checkbox changed:", $target);
        const configKeyName = $target.attr("name");
        if (!configKeyName) return;
        const newValue = $target.is(":checked");
        this.updateConfigValue(configKeyName, newValue);
        console.log("Config changed:", configKeyName, newValue);
        if ($target.parent().hasClass("base-setting")) {
          $target.parent().parent().toggleClass("enabled", newValue);
          if ($target.parent().parent().hasClass("has-subsettings")) {
            const subSettingsCheckboxes = $target
              .parent()
              .siblings(".sub-settings")
              .find('input[type="checkbox"]');
            subSettingsCheckboxes.prop("disabled", !newValue);
            console.log("Subsettings toggled", {
              subSettingsCheckboxes,
              newValue,
            });
          }
        }
      }
    );
    this.$configPannel.children(".tabs").children().first().trigger("click");

    async function addConfigPannelStyles() {
      GM_addStyle(cssConfigPannel);
    }
  }
}
