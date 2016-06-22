var aesjs = require('aes-js');
var fs = require('fs');
var scrypt = require('scrypt-hash');
var Protobuf = require('protobufjs');
var pkcs7 = require('pkcs7');
var _ = require('lodash');



var builder = Protobuf.loadProtoFile("wallet.proto");
var BitcoinjWallet = builder.build('wallet');
var Wallet = BitcoinjWallet.Wallet;

const PASSWORD = "foo";
var bytes = [];

for (var i = 0; i < PASSWORD.length; ++i) {
  var charCode = PASSWORD.charCodeAt(i);
  bytes.push((charCode & 0xFF00) >> 8);
  bytes.push(charCode & 0xFF);
}
const PASSWORD_UINT16 = new Buffer(Uint16Array.from(bytes));

// Is this a magic number?
const SCRYPT_SALT = new Buffer([
  0x35, 0x51, 0x03, 0x80, 0x75, 0xa3, 0xb0, 0xc5
]);

// Is this a magic number?
const IV = new Buffer([
  0xa3, 0x44, 0x39, 0x1f, 0x53, 0x83, 0x11, 0xb3,
  0x29, 0x54, 0x86, 0x16, 0xc4, 0x89, 0x72, 0x3e
]);

// console.log(IV);

scrypt(PASSWORD_UINT16, SCRYPT_SALT, 16384, 8, 1, 32, loadAndDecode);

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


function loadAndDecode(err, passwordHash) {
  var fileName = '/Users/bgok/Library/Application Support/MultiBitHD/mbhd-50b1841c-f02eff43-d86ced23-a475b780-00a74b6c/mbhd.wallet.aes';

  fs.readFile(fileName, function (err, encryptedWalletData) {
    var decrypted = decrypt(passwordHash, encryptedWalletData);
    var wallet = Wallet.decode(decrypted);

    var seed = _.find(wallet.getKey(), {type: 3});
    var encryptionParameters = wallet.getEncryptionParameters();

    var privateKey = seed.getEncryptedDeterministicSeed().getEncryptedPrivateKey().toBuffer();
    console.log(privateKey.length);
    var iv = seed.getEncryptedDeterministicSeed().getInitialisationVector().toBuffer();

    var salt = encryptionParameters.getSalt().toBuffer();
    var n = encryptionParameters.getN().toInt();
    var r = encryptionParameters.getR();
    var p = encryptionParameters.getP();

    scrypt(PASSWORD_UINT16, salt, n, r, p, 32, function(err, hash) {
      var result = decrypt(hash, privateKey);
      console.log(result.length);
      console.log(new Buffer(result).toString('hex'));
    });

    // console.log(wallet);
  });
}