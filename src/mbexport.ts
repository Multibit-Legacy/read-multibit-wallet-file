#!/usr/bin/env node

///<reference path="../build/wallet.d.ts"/>

import * as ByteBuffer from "bytebuffer";
import * as commander from "commander";
import {Decrypter} from "./aes-cbc-decrypter";
import fs =  require('fs');
import bcoin = require("bcoin");
import Type = MultibitWallet.Key.Type;

let Wallet = require('../build/wallet').wallet.Wallet;

let fileName: string;

commander
  .version('0.0.1')
  .arguments('<file>')
  .action((file: string) => {
    fileName = file;
  });

commander.parse(process.argv);

if (!fileName) {
  console.log('wallet file must be specified');
  commander.help();
}

let data: Buffer;
try {
  data = fs.readFileSync(fileName);
} catch (e) {
  console.log('Error opening wallet file');
  process.exit(e.errno);
}

let pb = ByteBuffer.wrap(data);
let wallet: MultibitWallet.Wallet;

try {
  wallet = Wallet.decode(pb);
  console.log('multibit classic wallet opened');
  console.assert(wallet.getKey().length !== 0, 'One or more keys should exist');
} catch (e) {
  console.log('MultibitHD wallet opened');
}

let keys: Array<MultibitWallet.Key> = wallet.getKey();
let keyPromises: Array<Promise<string>> = [];
let decrypter: Decrypter;

keys.forEach(function (key) {
  switch (key.getType()) {
    case Type.ORIGINAL:
      console.log('Unencrypted key');

      let secretBytes = key.getSecretBytes();
      console.assert(secretBytes, 'Secret bytes are not defined');

      let keyRing = bcoin.keyring.fromPrivate(secretBytes.toBuffer(), 'main');
      keyPromises.push(Promise.resolve(keyRing.toSecret()));

      break;

    case Type.ENCRYPTED_SCRYPT_AES:
      console.log('Encrypted key');
      let encryptedKey = key.getEncryptedData();
      console.assert(encryptedKey, 'Encrypted key is not defined');

      let encryptionParameters = wallet.getEncryptionParameters();
      console.assert(encryptionParameters, 'Encryption parameters undefined');

      let iv = encryptedKey.getInitialisationVector();
      let epk = encryptedKey.getEncryptedPrivateKey();

      if (!decrypter) {
        decrypter = Decrypter.factory('foo', encryptionParameters);
      }
      var p = decrypter.decrypt(epk, iv)
        .then((secretBytes) => {
          return bcoin.keyring.fromPrivate(secretBytes.toBuffer(), 'main').toSecret();
        });
      keyPromises.push(p);

      break;

    default:
      throw 'Unknown key type';
  }
});

Promise.all(keyPromises)
  .then((keys: Array<string>) => {
    keys.forEach((key) => {
      console.log(key);
    });
  });
