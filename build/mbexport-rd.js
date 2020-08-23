#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ByteBuffer = require("bytebuffer");
var commander = require("commander");
var aes_cbc_decrypter_1 = require("./aes-cbc-decrypter");
var fs = require("fs");
var bcoin = require("bcoin");
var prompt = require('prompt');
var FIXED_IV = ByteBuffer.wrap(new Uint8Array([
    0xa3, 0x44, 0x39, 0x1f, 0x53, 0x83, 0x11, 0xb3,
    0x29, 0x54, 0x86, 0x16, 0xc4, 0x89, 0x72, 0x3e
]));
prompt.message = '';
prompt.delimiter = '';
var Wallet = require('../build/wallet').wallet.Wallet;
var fileName;
commander
    .version(require('../package.json').version)
    .arguments('<wallet-file>')
    .action(function (file) {
    fileName = file;
});
commander.parse(process.argv);
if (!fileName) {
    console.log('A wallet file must be specified');
    commander.help();
}
var data;
try {
    data = fs.readFileSync(fileName);
}
catch (e) {
    console.log('Error opening wallet file');
    process.exit(e.errno);
}
var pb = ByteBuffer.wrap(data);
var walletPromise;
try {
    walletPromise = Promise.resolve(Wallet.decode(pb))
        .then(function (wallet) {
        console.log('multibit classic wallet opened');
        return wallet;
    });
}
catch (e) {
    console.log('MultibitHD wallet opened');
    var decrypter_1;
    walletPromise = getPassphrase()
        .then(function (passphrase) {
        decrypter_1 = aes_cbc_decrypter_1.Decrypter
            .factory(passphrase);
        pb.reset();
        return decrypter_1.decrypt(pb.slice(16), pb.slice(0, 16))
            .then(function (payload) {
            return Wallet.decode(payload);
        });
    })
        .catch(function (e) {
        pb.reset();
        return decrypter_1.decrypt(pb, FIXED_IV)
            .then(function (payload) {
            return Wallet.decode(payload);
        });
    });
}
walletPromise.then(function (wallet) {
    console.assert(wallet.getKey().length !== 0, 'One or more keys should exist');
    var keys = wallet.getKey();
    var keyPromises = [];
    var encryptionParameters = wallet.getEncryptionParameters();
    keys.forEach(function (key) {
        switch (key.getType()) {
            case 1:
                var secretBytes = key.getSecretBytes();
                console.assert(secretBytes, 'Secret bytes are not defined');
                var keyRing = bcoin.keyring.fromPrivate(secretBytes.toBuffer(), 'main');
                keyPromises.push(Promise.resolve(keyRing.toSecret()));
                break;
            case 2:
                console.assert(encryptionParameters, 'Encryption parameters undefined');
                keyPromises.push(readEncryptedKey(key, encryptionParameters, function (secretBytes) {
                    return bcoin.keyring.fromPrivate(secretBytes.toBuffer(), 'main').toSecret();
                }));
                break;
            case 3:
                console.assert(encryptionParameters, 'Encryption parameters undefined');
                keyPromises.push(readEncryptedKey(key, encryptionParameters, function (secretBytes) {
                    return secretBytes.toString('utf8');
                }));
                break;
            case 4:
                break;
            default:
                throw 'Unknown key type';
        }
    });
    Promise.all(keyPromises)
        .then(function (keys) {
        keys.forEach(function (key) {
            console.log(key);
        });
    });
});
function readEncryptedKey(key, encryptionParameters, formatter) {
    var encryptedKey = key.getEncryptedData();
    console.assert(encryptedKey, 'Encrypted key is not defined');
    return getPassphrase()
        .then(function (passphrase) {
        return aes_cbc_decrypter_1.Decrypter
            .factory(passphrase, encryptionParameters)
            .decrypt(encryptedKey.getEncryptedPrivateKey(), encryptedKey.getInitialisationVector());
    })
        .then(formatter);
}
var passphrase;
function getPassphrase() {
    if (!passphrase) {
        return new Promise(function (resolve, reject) {
            prompt.get([{
                    name: 'passphrase',
                    description: 'Enter your passphrase:',
                    replace: '*',
                    hidden: true
                }], function (err, result) {
                if (err) {
                    reject(err);
                }
                else {
                    passphrase = result.passphrase;
                    resolve(passphrase);
                }
            });
        });
    }
    else {
        return Promise.resolve(passphrase);
    }
}
