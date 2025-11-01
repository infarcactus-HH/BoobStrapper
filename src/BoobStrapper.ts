import StorageHandler from "./StorageHandler";
import {
  isRegisterGroupType,
  isRegisterModuleType,
  type moduleBDSMType,
} from "./typeCheck";
import HomeCss from "./css/Home.css";
import Helpers from "./Helpers";
import cssBaseVars from "./css/addBaseVars";
import cssConfigPannel from "./css/ConfigPannel.css";

export default class BoobStrapper {
  constructor() {
    unsafeWindow.BoobStrapperConfig = {
      registerGroup: this.registerGroup.bind(this),
      registerModule: this.registerModule.bind(this),
      runModules: this.runModules.bind(this),
    };
    unsafeWindow.BoobStrapper = {
      Helpers: {
        doWhenSelectorAvailable: Helpers.doWhenSelectorAvailable,
      },
    };
    if (location.pathname === "/home.html") {
      this.addConfigToggles();
    }
  }
  groups: Array<{ key: string; name: string }> = [];
  modules: Array<moduleBDSMType> = [];
  config: Record<string, boolean> = {};
  $settingsButton: JQuery<HTMLElement> | null = null;
  $configPannel: JQuery<HTMLElement> | null = null;

  registerGroup(group: any) {
    if (!isRegisterGroupType(group)) {
      throw new Error("Invalid group");
    }
    if (
      this.groups.find((registeredGroup) => registeredGroup.key === group.key)
    ) {
      console.warn(`Group with key ${group.key} is already registered.`);
      return;
    }
    this.groups.push(group);
  }
  registerModule(module: any) {
    if (!isRegisterModuleType(module)) {
      throw new Error("Invalid module");
    }
    if (
      !this.groups.find(
        (registeredGroup) => registeredGroup.key === module.group
      )
    ) {
      throw new Error(
        `Group with key ${module.configSchema.baseKey} is not registered.`
      );
    }
    this.modules.push(module);
    const moduleKey = StorageHandler.getConfigModuleKey(
      module.group,
      module.configSchema.baseKey
    );
    this.config[moduleKey] = StorageHandler.getConfigValue(
      moduleKey,
      module.configSchema.default
    );
    if (module.configSchema.subSettings) {
      const configSchemaBaseKey = module.configSchema.baseKey;
      for (const subSetting of module.configSchema.subSettings) {
        const subSettingKey = StorageHandler.getConfigSubSettingKey(
          module.group,
          configSchemaBaseKey,
          subSetting.key
        );
        this.config[subSettingKey] = StorageHandler.getConfigValue(
          subSettingKey,
          subSetting.default
        );
      }
    }
  }
  runModules() {
    for (const module of this.modules) {
      const moduleKey = StorageHandler.getConfigModuleKey(
        module.group,
        module.configSchema.baseKey
      );
      if (this.config[moduleKey]) {
        const subSettings = module.configSchema.subSettings?.reduce(
          (accumulator, subSetting) => {
            const subSettingKey = StorageHandler.getConfigSubSettingKey(
              module.group,
              module.configSchema.baseKey,
              subSetting.key
            );
            accumulator[subSetting.key] = this.config[subSettingKey];
            return accumulator;
          },
          {} as Record<string, boolean>
        );
        try {
          module.run(subSettings);
        } catch (e) {
          console.error(
            `Error running module ${module.configSchema.baseKey}:`,
            e
          );
        }
      }
    }
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
    this.$configPannel = $(`<div class="hh-plus-plus-config-panel boob-strapper shown">`);
    this.$settingsButton.after(this.$configPannel);
    const $closeButton = $(`<span class="close-config-panel"></span>`).on(
      "click",
      () => {
        this.$configPannel?.removeClass("shown");
      }
    );
    this.$configPannel.append($closeButton);
    const $tabContainer = $(`<div class="tabs hh-scroll"></div>`);
    this.$configPannel.append($tabContainer);
    for (const group of this.groups) {
      const $groupTab = $(
        `<h4 class="${group.key}" rel="${group.key}">${group.name}</div>`
      ).on("click", () => {
        $groupTab.siblings().removeClass("selected");
        $groupTab.addClass("selected");
        this.$configPannel
          ?.find(".group-panel")
          .removeClass("shown")
          .filter(`.group-panel[rel="${group.key}"]`)
          .addClass("shown");
      });
      $tabContainer.append($groupTab);
      const $groupContainer = $(
        `<div class="group-panel" rel="${group.key}"></div>`
      );
      this.$configPannel.append($groupContainer);
      const $panelContent = $(`<div class="panel-contents hh-scroll"></div>`);
      $groupContainer.append($panelContent);
      const modulesInGroup = this.modules.filter(
        (module) => module.group === group.key
      );
      for (const module of modulesInGroup) {
        const moduleKey = StorageHandler.getConfigModuleKey(
          module.group,
          module.configSchema.baseKey
        );
        const baseModuleEnabled = this.config[moduleKey];
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
            const subSettingKey = StorageHandler.getConfigSubSettingKey(
              module.group,
              module.configSchema.baseKey,
              subSetting.key
            );
            const subSettingEnabled = this.config[subSettingKey];
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
        StorageHandler.setConfigValue(configKeyName, newValue);
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