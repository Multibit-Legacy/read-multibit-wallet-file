///<reference path="../build/wallet.d.ts"/>
///<reference path="../typings/index.d.ts"/>

import {ScryptEncryptionKey} from "./scrypt-encryption-key";
import {Decrypter} from "./aes-cbc-decrypter";
var Wallet = require('../build/wallet').wallet.Wallet;
var ByteBuffer = require('bytebuffer');


const PASSWORD = "foo";
var fileName = '/Users/bgok/Library/Application Support/MultiBit/multibit.wallet';
var decrypter = new Decrypter(new ScryptEncryptionKey(PASSWORD));

document.getElementById('start-import').addEventListener('click', () => {
  chrome.fileSystem.chooseEntry({type: 'openFile'}, function (entry: FileEntry) {
    chrome.fileSystem.getDisplayPath(entry, function (path) {
      console.log(path)
    });

    entry.file((file) => {
      var reader = new FileReader();
      reader.onloadend = (e: any) => {
        var pb = ByteBuffer.wrap(e.target.result);
        var wallet: MultibitWallet.Wallet = Wallet.decode(e.target.result);
        var keys: Array<MultibitWallet.Key> = wallet.getKey();

        console.assert(keys.length !== 0, 'One or more keys should exist');

        var keyPromises: Array<Promise<ByteBuffer>> = [];

        keys.forEach(function (key) {
          var privateKey, encryptedKey;

          if (encryptedKey = key.getEncryptedData()) {
            var iv = encryptedKey.getInitialisationVector();
            var epk = encryptedKey.getEncryptedPrivateKey();
            keyPromises.push(decrypter.decrypt(epk, iv));
          } else {
            keyPromises.push(Promise.resolve(key.getPublicKey()));
          }
        });

        Promise.all(keyPromises)
          .then((keys: Array<ByteBuffer>) => {
            keys.forEach((key: ByteBuffer) => {
              console.log(key.toHex());
            });
          });
      };

      reader.readAsArrayBuffer(file);
    });
  });
});
