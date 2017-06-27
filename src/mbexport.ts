#!/usr/bin/env node

///<reference path="../build/wallet.d.ts"/>

import * as ByteBuffer from "bytebuffer";
import * as commander from "commander";
import {Decrypter} from "./aes-cbc-decrypter";
import fs =  require('fs');
let bcoin = require("bcoin");
import Type = MultibitWallet.Key.Type;
import ScryptParameters = MultibitWallet.ScryptParameters;
let prompt = require('prompt');

const FIXED_IV = ByteBuffer.wrap(new Uint8Array([
  0xa3, 0x44, 0x39, 0x1f, 0x53, 0x83, 0x11, 0xb3,
  0x29, 0x54, 0x86, 0x16, 0xc4, 0x89, 0x72, 0x3e
]));

prompt.message = '';
prompt.delimiter = '';

let Wallet = require('../build/wallet').wallet.Wallet;

let fileName: string;

commander
  .version(require('../package.json').version)
  .arguments('<wallet-file>')
  .action((file: string) => {
    fileName = file;
  });

commander.parse(process.argv);

if (!fileName) {
  console.log('A wallet file must be specified');
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

  let decrypter: Decrypter;

  walletPromise = getPassphrase()
    .then((passphrase: string) => {
      decrypter = Decrypter
        .factory(passphrase);

      pb.reset();
      return decrypter.decrypt(pb.slice(16), pb.slice(0,16))
        .then((payload) => {
          return Wallet.decode(payload);
        });
    })
    .catch((e) => {
      pb.reset();
      return decrypter.decrypt(pb, FIXED_IV)
        .then((payload) => {
          return Wallet.decode(payload);
        });
    });
}

walletPromise.then((wallet: MultibitWallet.Wallet) => {
  console.assert(wallet.getKey().length !== 0, 'One or more keys should exist');

  let keys: Array<MultibitWallet.Key> = wallet.getKey();
  let keyPromises: Array<Promise<string>> = [];
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

  return getPassphrase()
    .then((passphrase: string) => {
      return Decrypter
        .factory(passphrase, encryptionParameters)
        .decrypt(encryptedKey.getEncryptedPrivateKey(), encryptedKey.getInitialisationVector());
    })
    .then(formatter);
}

let passphrase: string;

function getPassphrase(): Promise<string> {
  if (!passphrase) {
    return new Promise((resolve, reject) => {
      prompt.get([{
        name       : 'passphrase',
        description: 'Enter your passphrase:',
        replace    : '*',
        hidden     : true
      }], (err: any, result: any) => {
        if (err) {
          reject(err);
        } else {
          passphrase = result.passphrase;
          resolve(passphrase);
        }
      });
    });
  } else {
    return Promise.resolve(passphrase);
  }
}
