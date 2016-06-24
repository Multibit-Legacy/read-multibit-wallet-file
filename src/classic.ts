///<reference path="../typings/index.d.ts"/>

import {ScryptEncryptionKey} from "./scrypt-encryption-key";
import {Decrypter} from "./aes-cbc-decrypter";
var Wallet = require('../protocol-buffers/wallet').wallet.Wallet;
var ByteBuffer = require('bytebuffer');


const PASSWORD = "foo";
var fileName = '/Users/bgok/Library/Application Support/MultiBit/multibit.wallet';
var decrypter = new Decrypter(new ScryptEncryptionKey(PASSWORD));

document.getElementById('start-import').addEventListener('click', () => {
  chrome.fileSystem.chooseEntry({type: 'openFile'}, function (entry: FileEntry) {
    console.log(entry);
    chrome.fileSystem.getDisplayPath(entry, function (path) {
      console.log(path)
    });

    entry.file((file) => {
      var reader = new FileReader();
      reader.onloadend = (e: any) => {
        var pb = ByteBuffer.wrap(e.target.result);
        var wallet = Wallet.decode(e.target.result);
        var keys = wallet.getKey();

        console.assert(keys && keys.length, 'One or more keys should exist');

        var keyPromises: Array<Promise<ByteBuffer>> = [];

        keys.forEach(function (key) {
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
      };

      reader.readAsArrayBuffer(file);
    });
  });
});
