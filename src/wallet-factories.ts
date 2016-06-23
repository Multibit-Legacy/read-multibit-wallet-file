var Protobuf = require('protobufjs');

export class WalletFactories {
  private static root = Protobuf.loadProtoFile("protocol-buffers/wallet.proto").build('wallet');
  
  public static get Wallet() {
    return WalletFactories.root.Wallet;
  }
}