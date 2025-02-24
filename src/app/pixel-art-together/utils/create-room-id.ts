export function createRoomId(): string {
  let id = new URLSearchParams(window.location.search).get("room");
  if (!id) {
    id = generateRandomId();
    window.location.search = `?room=${id}`;
  }
  return id;
}

function generateRandomId(): string {
  return "xxxxxxxxxxxxxxxxxxxxx".replace(/[x]/g, () => {
    return ((Math.random() * 16) | 0).toString(16);
  });
}
