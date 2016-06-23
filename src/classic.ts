///<reference path="../typings/index.d.ts"/>

import {ScryptEncryptionKey} from "./scrypt-encryption-key";
import {WalletFactories} from "./wallet-factories";
import {Decrypter} from "./aes-cbc-decrypter";

var fs = require('fs');

const PASSWORD = "foo";
var fileName = '/Users/bgok/Library/Application Support/MultiBit/multibit.wallet';

var decrypter = new Decrypter(new ScryptEncryptionKey(PASSWORD));

fs.readFile(fileName, (err, walletData) => {
  var wallet = WalletFactories.Wallet.decode(walletData);
  var keys = wallet.getKey();

  console.assert(keys && keys.length, 'One or more keys should exist');

  var keyPromises: Array<Promise<ByteBuffer>> = [];
  
  keys.forEach(function(key) {
    var privateKey, encryptedKey;

    if (encryptedKey = key.getEncryptedData()) {
      var iv = encryptedKey.getInitialisationVector();
      var epk = encryptedKey.getEncryptedPrivateKey();
      keyPromises.push(decrypter.decrypt(epk, iv));
    } else {
      keyPromises.push(key.getPublicKey());
    }
  });


  Promise.all(keyPromises)
    .then((keys: Array<ByteBuffer>) => {
      keys.forEach((key: ByteBuffer) => {
        console.log(key.toHex());
      });
    });
});
