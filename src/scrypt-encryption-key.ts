var ByteBuffer = require('bytebuffer');
var scrypt = require('scrypt-async');

const DEFAULT_N = 16384;
const DEFAULT_R = 8;
const DEFAULT_P = 1;
const DEFAULT_DERIVED_KEY_LENGTH = 32;

const DEFAULT_SALT = ByteBuffer.wrap([
  0xac, 0x35, 0x72, 0xb2, 0x47, 0xc6, 0x87, 0x32
]);

interface Math {
  log2(x: number): number;
}
declare var Math: Math;

export class ScryptEncryptionKey {
  private salt: ByteBuffer;
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
      this._passwordBuffer = ByteBuffer.wrap(bytes);
    }
    return this._passwordBuffer;
  }

  private _keyPromise: Promise<ByteBuffer>;
  public get keyPromise() {
    if (!this._keyPromise) {
      this._keyPromise = new Promise((resolve, reject) => {
        var pw = new Uint8Array(this.passwordBuffer.toBuffer());
        var salt = new Uint8Array(this.salt.toBuffer());
        scrypt(pw, salt,
          Math.log2(this.n), this.r, this.derivedKeyLength,
          (hash) => {
            console.log(hash);
            resolve(ByteBuffer.wrap(hash));
          }
        );
      });
    }
    return this._keyPromise;
  }

  constructor(private password: string, salt?: ByteBuffer,
              n?: number, r?: number, p?: number,
              derivedKeyLength?: number) {
    this.salt = salt || DEFAULT_SALT;
    this.n = n || DEFAULT_N;
    this.r = r || DEFAULT_R;
    this.p = p || DEFAULT_P;
    this.derivedKeyLength = derivedKeyLength || DEFAULT_DERIVED_KEY_LENGTH;
  }
}