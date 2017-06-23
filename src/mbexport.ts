#!/usr/bin/env node

///<reference path="../build/wallet.d.ts"/>

import * as ByteBuffer from "bytebuffer";
import * as commander from "commander";
import {Decrypter} from "./aes-cbc-decrypter";
import fs =  require('fs');
import bcoin = require("bcoin");
import Type = MultibitWallet.Key.Type;
import ScryptParameters = MultibitWallet.ScryptParameters;

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
let walletPromise: Promise<MultibitWallet.Wallet>;

try {
  walletPromise = Promise.resolve(Wallet.decode(pb))
    .then((wallet) => {
      console.log('multibit classic wallet opened');
      return wallet;
    });
} catch (e) {
  console.log('MultibitHD wallet opened');

  let iv = pb.slice(0, 16);
  let encryptedPayload = pb.slice(16);
  let decrypter = Decrypter.factory('foo');

  walletPromise = decrypter.decrypt(encryptedPayload, iv)
    .then((payload) => {
      return Wallet.decode(payload);
    });

}

walletPromise.then((wallet: MultibitWallet.Wallet) => {
  console.assert(wallet.getKey().length !== 0, 'One or more keys should exist');

  let keys: Array<MultibitWallet.Key> = wallet.getKey();
  let keyPromises: Array<Promise<string>> = [];
  let decrypter: Decrypter;
  let encryptionParameters = wallet.getEncryptionParameters();

  keys.forEach(function (key) {
    switch (key.getType()) {
      case Type.ORIGINAL:
        let secretBytes = key.getSecretBytes();
        console.assert(secretBytes, 'Secret bytes are not defined');

        let keyRing = bcoin.keyring.fromPrivate(secretBytes.toBuffer(), 'main');
        keyPromises.push(Promise.resolve(keyRing.toSecret()));
        break;

      case Type.ENCRYPTED_SCRYPT_AES:
        console.assert(encryptionParameters, 'Encryption parameters undefined');
        keyPromises.push(readEncryptedKey(key, encryptionParameters, (secretBytes) => {
          return bcoin.keyring.fromPrivate(secretBytes.toBuffer(), 'main').toSecret();
        }));
        break;

      case Type.DETERMINISTIC_MNEMONIC:
        console.assert(encryptionParameters, 'Encryption parameters undefined');
        keyPromises.push(readEncryptedKey(key, encryptionParameters, (secretBytes) => {
          return secretBytes.toString('utf8');
        }));
        break;

      case Type.DETERMINISTIC_KEY:
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
});

function readEncryptedKey(key: MultibitWallet.Key,
                          encryptionParameters: ScryptParameters,
                          formatter: (bytes: ByteBuffer) => string): Promise<string> {
  let encryptedKey = key.getEncryptedData();
  console.assert(encryptedKey, 'Encrypted key is not defined');

  let iv = encryptedKey.getInitialisationVector();
  let epk = encryptedKey.getEncryptedPrivateKey();

  let decrypter = Decrypter.factory('foo', encryptionParameters);

  return decrypter.decrypt(epk, iv)
    .then(formatter);
}
