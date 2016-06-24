import {ScryptEncryptionKey} from "./scrypt-encryption-key";

var ByteBuffer = require('bytebuffer');
var aesjs = require('aes-js');
var pkcs7 = require('pkcs7');

const FRAGMENT_SIZE = 16;

export class Decrypter {
  constructor(private key: ScryptEncryptionKey) {
  }

  public decrypt(data: ByteBuffer, iv: ByteBuffer): Promise<ByteBuffer> {
    return this.initialize(iv)
      .then((aesCbc): ByteBuffer => {
        var decrypted = new ByteBuffer(data.capacity());
        decrypted.limit = 0;
        while (data.remaining()) {
          var fragment = new Uint8Array(data.slice(data.offset, data.offset + FRAGMENT_SIZE).toBuffer());
          var d = aesCbc.decrypt(fragment);
          decrypted.limit += FRAGMENT_SIZE;
          decrypted.append(ByteBuffer.wrap(d));
          data.skip(FRAGMENT_SIZE);
        }
        decrypted.reset();

        return this.removePadding(decrypted);
      });
  }

  private initialize(iv: ByteBuffer): Promise<any> {
    return this.key.keyPromise
      .then((key: ByteBuffer) => {
        var keyArray = new Uint8Array(key.toBuffer());
        var ivArray = new Uint8Array(iv.toBuffer());
        return new aesjs.ModeOfOperation.cbc(keyArray, ivArray);
      });
  }

  private removePadding(padddedMessage: ByteBuffer): ByteBuffer {
    return ByteBuffer.wrap(
      pkcs7.unpad(new Uint8Array(padddedMessage.toBuffer())));
  }
}