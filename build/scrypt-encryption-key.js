"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ByteBuffer = require("bytebuffer");
var scrypt = require('scrypt-async');
var DEFAULT_N = 16384;
var DEFAULT_R = 8;
var DEFAULT_P = 1;
var DEFAULT_DERIVED_KEY_LENGTH = 32;
var DEFAULT_SALT = new Buffer([
    0x35, 0x51, 0x03, 0x80, 0x75, 0xa3, 0xb0, 0xc5
]);
var ScryptEncryptionKey = (function () {
    function ScryptEncryptionKey(password, salt, n, r, p, derivedKeyLength) {
        this.password = password;
        this.salt = salt || DEFAULT_SALT;
        this.n = n || DEFAULT_N;
        this.r = r || DEFAULT_R;
        this.p = p || DEFAULT_P;
        this.derivedKeyLength = derivedKeyLength || DEFAULT_DERIVED_KEY_LENGTH;
    }
    Object.defineProperty(ScryptEncryptionKey.prototype, "passwordBuffer", {
        get: function () {
            if (!this._passwordBuffer) {
                var bytes = [];
                for (var i = 0; i < this.password.length; ++i) {
                    var charCode = this.password.charCodeAt(i);
                    bytes.push((charCode & 0xFF00) >> 8);
                    bytes.push(charCode & 0xFF);
                }
                this._passwordBuffer = ByteBuffer.wrap(new Uint8Array(bytes));
            }
            return this._passwordBuffer;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ScryptEncryptionKey.prototype, "keyPromise", {
        get: function () {
            var _this = this;
            if (!this._keyPromise) {
                this._keyPromise = new Promise(function (resolve, reject) {
                    var pw = new Uint8Array(_this.passwordBuffer.toBuffer());
                    scrypt(pw, _this.salt, Math.log2(_this.n), _this.r, _this.derivedKeyLength, function (hash) {
                        resolve(ByteBuffer.wrap(hash));
                    });
                });
            }
            return this._keyPromise;
        },
        enumerable: true,
        configurable: true
    });
    return ScryptEncryptionKey;
}());
exports.ScryptEncryptionKey = ScryptEncryptionKey;
