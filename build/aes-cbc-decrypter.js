"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var scrypt_encryption_key_1 = require("./scrypt-encryption-key");
var crypto = require("crypto");
var ByteBuffer = require("bytebuffer");
var FRAGMENT_SIZE = 16;
var Decrypter = (function () {
    function Decrypter(key) {
        this.key = key;
    }
    Decrypter.factory = function (passphrase, scryptParameters) {
        var key;
        if (scryptParameters) {
            key = new scrypt_encryption_key_1.ScryptEncryptionKey(passphrase, (scryptParameters.salt.toBuffer()));
        }
        else {
            key = new scrypt_encryption_key_1.ScryptEncryptionKey(passphrase);
        }
        return new Decrypter(key);
    };
    Decrypter.prototype.decrypt = function (data, iv) {
        return this.initialize(iv)
            .then(function (aesCbc) {
            var decrypted = Buffer.concat([
                aesCbc.update(Buffer.from(data.toBuffer())),
                aesCbc.final()
            ]);
            return ByteBuffer.wrap(decrypted);
        });
    };
    Decrypter.prototype.initialize = function (iv) {
        return this.key.keyPromise
            .then(function (key) {
            return crypto.createDecipheriv('aes-256-cbc', key.toBuffer(), iv.toBuffer());
        })
            .catch(function () { return console.log('whoa. fail.'); });
    };
    return Decrypter;
}());
exports.Decrypter = Decrypter;
