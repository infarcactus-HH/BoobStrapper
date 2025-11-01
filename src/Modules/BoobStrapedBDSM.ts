import Helpers from "../Helpers";

export default class BoobStrapBDSM {
  hasRun = false;
  group = "BoobStrapper";
  configSchema = {
    baseKey: "boobStrapBDSM",
    label: "Emulate HH++ BDSM",
    default: false,
  };
  run() {
    if (this.hasRun) return;
    this.hasRun = true;
    console.log("BoobStrapBDSM module running");
    unsafeWindow.hhPlusPlusConfig = {
      registerGroup: unsafeWindow.BoobStrapperConfig.registerGroup,
      registerModule: unsafeWindow.BoobStrapperConfig.registerModule,
      loadConfig() {}, // only here for compatibility
      runModules: unsafeWindow.BoobStrapperConfig.runModules,
      BoobStrapped: true,
    };
    unsafeWindow.HHPlusPlus = {
      Helpers: {
        doWhenSelectorAvailable: Helpers.doWhenSelectorAvailable,
      },
      BoobStrapped: true,
    };
    $(document).trigger("hh++-bdsm:loaded");
  }
}
