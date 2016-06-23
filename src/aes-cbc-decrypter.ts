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
          var fragment = data.slice(data.offset, data.offset + FRAGMENT_SIZE);
          var d = aesCbc.decrypt(fragment.toBuffer());
          decrypted.limit += FRAGMENT_SIZE;
          decrypted.append(d);
          data.skip(FRAGMENT_SIZE);
        }
        decrypted.reset();

        return this.removePadding(decrypted);
      });
  }

  private initialize(iv: ByteBuffer): Promise<any> {
    return this.key.keyPromise
      .then((key: ByteBuffer) => {
        return new aesjs.ModeOfOperation.cbc(key.toBuffer(), iv.toBuffer());
      });
  }

  private removePadding(padddedMessage: ByteBuffer): ByteBuffer {
    return ByteBuffer.wrap(pkcs7.unpad(padddedMessage.toBuffer()));
  }
}