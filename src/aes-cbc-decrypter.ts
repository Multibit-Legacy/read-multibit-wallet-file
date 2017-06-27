import {ScryptEncryptionKey} from "./scrypt-encryption-key";
import crypto = require('crypto');
import * as ByteBuffer from "bytebuffer";
import {Decipher} from "crypto";
import ScryptParameters = MultibitWallet.ScryptParameters;

export class Decrypter {
  public static factory(passphrase: string, scryptParameters?: ScryptParameters): Decrypter {
    let key: ScryptEncryptionKey;

    if (scryptParameters) {
      key = new ScryptEncryptionKey(passphrase, <any>(scryptParameters.salt.toBuffer()));
    } else {
      key = new ScryptEncryptionKey(passphrase);
    }
    return new Decrypter(key);
  }

  private constructor(private key: ScryptEncryptionKey) {}

  public decrypt(data: ByteBuffer, iv: ByteBuffer): Promise<ByteBuffer> {
    return this.initialize(iv)
      .then((aesCbc: Decipher) => {
        let mainBuffer = aesCbc.update(Buffer.from(data.toBuffer()));
        let finalBuffer = aesCbc.final();
        let decrypted: Buffer = Buffer.concat([
          mainBuffer,
          finalBuffer
        ]);

        return ByteBuffer.wrap(decrypted);
      });
  }

  private initialize(iv: ByteBuffer): Promise<Decipher> {
    return this.key.keyPromise
      .then<Decipher>((key: ByteBuffer) => {
        return crypto.createDecipheriv('aes-256-cbc', key.toBuffer(), iv.toBuffer());
      });
  }
}