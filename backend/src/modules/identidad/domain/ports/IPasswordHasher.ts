/** Puerto de salida — implementado en adapters/security/BcryptPasswordHasher (RNF-005, ADR-005). */
export interface IPasswordHasher {
  hash(password: string): Promise<string>;
  compare(password: string, hash: string): Promise<boolean>;
}
