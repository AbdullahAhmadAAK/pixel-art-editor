/**
 * Copies the current page URL to the clipboard.
 * 
 * This function retrieves the current window's URL and copies it to the clipboard
 * using `copyTextToClipboard`.
 */
export function copyUrlToClipboard() {
  copyTextToClipboard(window.location.href);
}

/**
 * Copies the given text to the clipboard.
 * 
 * If the Clipboard API is available, it uses `navigator.clipboard.writeText()`.
 * Otherwise, it falls back to `fallbackCopyTextToClipboard()` which manually creates 
 * a temporary text area for copying.
 * 
 * @param {string} text - The text to copy to the clipboard.
 */
export function copyTextToClipboard(text: string) {
  if (!navigator.clipboard) {
    fallbackCopyTextToClipboard(text);
    return;
  }
  navigator.clipboard.writeText(text).then(
    () => { },
    function (err) {
      console.error("Unable to copy", err);
    }
  );
}

/**
 * Fallback method to copy text to the clipboard.
 * 
 * This function creates a temporary `<textarea>`, appends it to the DOM, selects its content,
 * executes the `document.execCommand("copy")`, and then removes the element. 
 * 
 * This method is used when `navigator.clipboard` is unavailable.
 * 
 * @param {string} text - The text to copy to the clipboard.
 */
function fallbackCopyTextToClipboard(text: string) {
  const textArea = document.createElement("textarea");
  textArea.value = text;

  // Prevent scrolling to bottom
  textArea.style.top = "0";
  textArea.style.left = "0";
  textArea.style.position = "fixed";

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    document.execCommand("copy");
  } catch (err) {
    console.error("Unable to copy", err);
  }

  document.body.removeChild(textArea);
}
