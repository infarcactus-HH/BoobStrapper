import BoobStrapper from "./BoobStrapper";
import BoobStrapBDSM from "./Modules/BoobStrapedBDSM";

class Userscript {
  constructor() {
    new BoobStrapper();
    this.registerBoobStrapModules();
  }

  registerBoobStrapModules() {
    unsafeWindow.BoobStrapperConfig.registerGroup({
      key: "BoobStrapper",
      name: "Boob Strapper",
    });
    unsafeWindow.BoobStrapperConfig.registerModule(new BoobStrapBDSM());
    unsafeWindow.BoobStrapperConfig.runModules();
  }
}

new Userscript();
