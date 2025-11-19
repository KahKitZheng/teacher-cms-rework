export function randomId(length = 10) {
  const possible = "0123456789";

  const crypto = window.crypto;
  const array = new Uint32Array(length);

  return new Array(length)
    .fill(0)
    .map((_, index) =>
      possible.charAt(
        Math.floor(crypto.getRandomValues(array)[index] % possible.length)
      )
    )
    .join("");
}
