import {ScryptEncryptionKey} from "./scrypt-encryption-key";
import crypto = require('crypto');
import * as ByteBuffer from "bytebuffer";
import {Decipher} from "crypto";
import ScryptParameters = MultibitWallet.ScryptParameters;

// var aesjs = require('aes-js');
var pkcs7 = require('pkcs7');

const FRAGMENT_SIZE = 16;

export class Decrypter {
  public static factory(passphrase: string, scryptParameters: ScryptParameters): Decrypter {
    let key: ScryptEncryptionKey = new ScryptEncryptionKey(passphrase, scryptParameters.getSalt());
    return new Decrypter(key);
  }

  private constructor(private key: ScryptEncryptionKey) {
  }

  public decrypt(data: ByteBuffer, iv: ByteBuffer): Promise<ByteBuffer> {
    return this.initialize(iv)
      .then((aesCbc: Decipher) => {
        let decrypted: Buffer = Buffer.concat([
          aesCbc.update(Buffer.from(data.toBuffer())),
          aesCbc.final()
        ]);

        return ByteBuffer.wrap(decrypted);
      });
  }

  private initialize(iv: ByteBuffer): Promise<Decipher> {
    return this.key.keyPromise
      .then<Decipher>((key: ByteBuffer) => {
        return crypto.createDecipheriv('aes-256-cbc', key.toBuffer(), iv.toBuffer());
      })
      .catch(() => console.log('whoa. fail.'));
  }
}