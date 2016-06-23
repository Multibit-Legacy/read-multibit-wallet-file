var ByteBuffer = require('bytebuffer');
var scrypt = require('scrypt-hash');

const DEFAULT_N = 16384;
const DEFAULT_R = 8;
const DEFAULT_P = 1;
const DEFAULT_MEMORY = 32;

const DEFAULT_SALT = ByteBuffer.wrap([
  0xac, 0x35, 0x72, 0xb2, 0x47, 0xc6, 0x87, 0x32
]);

export class ScryptEncryptionKey {

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
        scrypt(this.passwordBuffer.toBuffer(), this.salt.toBuffer(), this.n,
          this.r, this.p, this.memory,
          (err, hash) => {
            if (err) {
              reject(err);
            } else {
              resolve(ByteBuffer.wrap(hash));
            }
          }
        );
      });
    }
    return this._keyPromise;
  }

  constructor(private password: string, private salt?: ByteBuffer,
              private n?: number, private r?: number, private p?: number,
              private memory?: number) {
    this.salt = this.salt || DEFAULT_SALT;
    this.n = this.n || DEFAULT_N;
    this.r = this.r || DEFAULT_R;
    this.p = this.p || DEFAULT_P;
    this.memory = this.memory || DEFAULT_MEMORY;
  }
}