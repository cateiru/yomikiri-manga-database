const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const CODE_LENGTH = 8;

/** 引き継ぎコードを生成する。紛らわしい文字（0/O, 1/I/L）は除外している */
export function generateTransferCode(): string {
  const randomValues = new Uint32Array(CODE_LENGTH);
  crypto.getRandomValues(randomValues);
  let code = "";
  for (const value of randomValues) {
    code += CODE_ALPHABET[value % CODE_ALPHABET.length];
  }
  return code;
}
