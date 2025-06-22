/**
 * Creates or retrieves a unique room ID from the URL.
 * 
 * If a `room` parameter exists in the URL, it returns that ID.
 * Otherwise, it generates a new random room ID, updates the URL with it, 
 * and returns the newly created ID.
 * 
 * @returns {string} The room ID.
 */
export function createRoomId(): string {
  let id = new URLSearchParams(window.location.search).get("room");
  if (!id) {
    id = generateRandomId();
    window.location.search = `?room=${id}`;
  }
  return id;
}

/**
 * Generates a random unique identifier.
 * 
 * The generated ID consists of 21 hexadecimal characters, 
 * each randomly replaced using `Math.random()`.
 * 
 * @returns {string} A randomly generated room ID.
 */
function generateRandomId(): string {
  return "xxxxxxxxxxxxxxxxxxxxx".replace(/[x]/g, () => {
    return ((Math.random() * 16) | 0).toString(16);
  });
}
