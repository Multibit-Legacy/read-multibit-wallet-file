import * as ByteBuffer from "bytebuffer";
var scrypt = require('scrypt-async');

const DEFAULT_N = 16384;
const DEFAULT_R = 8;
const DEFAULT_P = 1;
const DEFAULT_DERIVED_KEY_LENGTH = 32;

const DEFAULT_SALT = new Buffer([
  0x35, 0x51, 0x03, 0x80, 0x75, 0xa3, 0xb0, 0xc5
]);

interface Math {
  log2(x: number): number;
}
declare var Math: Math;

export class ScryptEncryptionKey {
  private salt: Buffer;
  private n: number;
  private r: number;
  private p: number;
  private derivedKeyLength: number;

  private _passwordBuffer: ByteBuffer;
  private get passwordBuffer(): ByteBuffer {
    if (!this._passwordBuffer) {
      var bytes = [];

      for (var i = 0; i < this.password.length; ++i) {
        var charCode = this.password.charCodeAt(i);
        bytes.push((charCode & 0xFF00) >> 8);
        bytes.push(charCode & 0xFF);
      }
      this._passwordBuffer = ByteBuffer.wrap(new Uint8Array(bytes));
    }
    return this._passwordBuffer;
  }

  private _keyPromise: Promise<ByteBuffer>;
  public get keyPromise() {
    if (!this._keyPromise) {
      this._keyPromise = new Promise((resolve, reject) => {
        var pw = new Uint8Array(this.passwordBuffer.toBuffer());
        scrypt(
          pw, this.salt,
          Math.log2(this.n), this.r, this.derivedKeyLength,
          (hash: any) => {
            resolve(ByteBuffer.wrap(hash));
          }
        );
      });
    }
    return this._keyPromise;
  }

  constructor(private password: string, salt?: Buffer,
              n?: number, r?: number, p?: number,
              derivedKeyLength?: number) {
    this.salt = salt || DEFAULT_SALT;
    this.n = n || DEFAULT_N;
    this.r = r || DEFAULT_R;
    this.p = p || DEFAULT_P;
    this.derivedKeyLength = derivedKeyLength || DEFAULT_DERIVED_KEY_LENGTH;
  }
}