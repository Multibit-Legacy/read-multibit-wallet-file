var fs = require('fs');
var Protobuf = require('protobufjs');
var ByteBuffer = require('bytebuffer');
var aesjs = require('aes-js');
var scrypt = require('scrypt-hash');
var pkcs7 = require('pkcs7');
var _ = require('lodash');


// Is this a magic number?
const SCRYPT_SALT = new Buffer([
  0xac, 0x35, 0x72, 0xb2, 0x47, 0xc6, 0x87, 0x32
]);

const PASSWORD = "foo";
var bytes = [];

for (var i = 0; i < PASSWORD.length; ++i) {
  var charCode = PASSWORD.charCodeAt(i);
  bytes.push((charCode & 0xFF00) >> 8);
  bytes.push(charCode & 0xFF);
}
const PASSWORD_UINT16 = new Buffer(Uint16Array.from(bytes));

const n = 16384;
const r = 8;
const p = 1;

var builder = Protobuf.loadProtoFile("wallet.proto");
var BitcoinjWallet = builder.build('wallet');
var Wallet = BitcoinjWallet.Wallet;

var fileName = '/Users/bgok/Library/Application Support/MultiBit/multibit.wallet';

fs.readFile(fileName, function (err, walletData) {
  var wallet = Wallet.decode(walletData);
  var keys = wallet.getKey();

  console.assert(keys && keys.length, 'One or more keys should exist');

  keys.forEach(function(key) {
    var privateKey, encryptedKey;

    if (encryptedKey = key.getEncryptedData()) {
      var iv = encryptedKey.getInitialisationVector().toBuffer();
      var epk = encryptedKey.getEncryptedPrivateKey().toBuffer();

      scrypt(PASSWORD_UINT16, SCRYPT_SALT, 16384, 8, 1, 32, function decrypt(err, hash) {
        var fragments = [];
        var aesCbc = new aesjs.ModeOfOperation.cbc(hash, iv);

        var idx = 0;
        while (idx < epk.length) {
          var fragment = new Buffer(16);
          var remaining = epk.length - idx + 1;

          epk.copy(fragment, 0, idx, idx + Math.min(fragment.length, remaining));
          fragments.push(aesCbc.decrypt(fragment));
          idx += fragment.length;
        }
        var decrypted = pkcs7.unpad(Buffer.concat(fragments));
        console.log(ByteBuffer.wrap(decrypted).toHex());
      });

    } else {
      privateKey = key.getPublicKey();
    }
  });
});

function decrypt(hash, data) {
  var fragments = [];
  var aesCbc = new aesjs.ModeOfOperation.cbc(hash, IV);

  var idx = 0;
  while (idx < data.length) {
    var fragment = new Buffer(16);
    var remaining = data.length - idx + 1;

    data.copy(fragment, 0, idx, idx + Math.min(fragment.length, remaining));
    fragments.push(aesCbc.decrypt(fragment));

    idx += fragment.length;
  }
  var decrypted = pkcs7.unpad(Buffer.concat(fragments));
  return decrypted;
}
