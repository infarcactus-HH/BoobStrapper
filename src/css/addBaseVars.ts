import Helpers from "../Helpers";

declare const IMAGES_URL: string;

export default class cssBaseVars {
    static run(){
        Helpers.doWhenSelectorAvailable("header > .hh_logo > img", ($img) => {
            const logo = $img.attr("src");
            GM_addStyle(`:root {--config-button-icon: url(${logo});}`);
        });
        GM_addStyle(`:root {--cross-icon : url(${IMAGES_URL}/clubs/ic_xCross.png)}`)
    }
}