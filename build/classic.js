"use strict";
var scrypt_encryption_key_1 = require("./scrypt-encryption-key");
var aes_cbc_decrypter_1 = require("./aes-cbc-decrypter");
var Wallet = require('../build/wallet').wallet.Wallet;
var ByteBuffer = require('bytebuffer');
var PASSWORD = "foo";
var fileName = '/Users/bgok/Library/Application Support/MultiBit/multibit.wallet';
var decrypter = new aes_cbc_decrypter_1.Decrypter(new scrypt_encryption_key_1.ScryptEncryptionKey(PASSWORD));
document.getElementById('start-import').addEventListener('click', function () {
    chrome.fileSystem.chooseEntry({ type: 'openFile' }, function (entry) {
        chrome.fileSystem.getDisplayPath(entry, function (path) {
            console.log(path);
        });
        entry.file(function (file) {
            var reader = new FileReader();
            reader.onloadend = function (e) {
                var pb = ByteBuffer.wrap(e.target.result);
                var wallet = Wallet.decode(e.target.result);
                var keys = wallet.getKey();
                console.assert(keys.length !== 0, 'One or more keys should exist');
                var keyPromises = [];
                keys.forEach(function (key) {
                    var privateKey, encryptedKey;
                    if (encryptedKey = key.getEncryptedData()) {
                        var iv = encryptedKey.getInitialisationVector();
                        var epk = encryptedKey.getEncryptedPrivateKey();
                        keyPromises.push(decrypter.decrypt(epk, iv));
                    }
                    else {
                        keyPromises.push(Promise.resolve(key.getPublicKey()));
                    }
                });
                Promise.all(keyPromises)
                    .then(function (keys) {
                    keys.forEach(function (key) {
                        console.log(key.toHex());
                    });
                });
            };
            reader.readAsArrayBuffer(file);
        });
    });
});
