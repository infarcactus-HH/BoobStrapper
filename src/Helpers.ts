export default class Helpers {
  static doWhenSelectorAvailable(
    selector: string,
    callback: ($element: JQuery<HTMLElement>) => void
  ) {
    const $elementOnCall = $(selector);
    if ($elementOnCall.length) {
      callback($elementOnCall);
    } else {
      const observer = new MutationObserver(() => {
        const $elementNow = $(selector);
        if ($elementNow.length) {
          observer.disconnect();
          callback($elementNow);
        }
      });
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
      });
    }
  }
}
