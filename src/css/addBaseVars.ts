import Helpers from "../Helpers";

declare const IMAGES_URL: string;

export default class cssBaseVars {
    static run(){
        GM_addStyle(`:root {--cross-icon : url(${IMAGES_URL}/clubs/ic_xCross.png)}`)
    }
}