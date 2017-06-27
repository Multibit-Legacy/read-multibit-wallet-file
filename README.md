A simple command line tool that exports the private Keys from a Multibit
wallet file. The reason this tool exists is because Multibit is out of
date and has known bugs. Exporting the private keys or wallet words from
Multibit and importing them into another wallet may be the only
effective way to access your funds.

Installation
============
1. Install node version 6 or higher. You can get it from
   https://nodejs.org/en/download/.
2. Open a command prompt and install this utility:
   ```npm install -g mbexport```

Now you are ready to export the private keys from your wallet.


Locating your wallet file
=========================

### Mac OS

| Version | Wallet file location |
|---|---|
| **Multibit Classic** | `~/Library/Application Support/MultiBit/*.wallet` |
| **MultibitHD** | ~/Library/Application Support/MultiBitHD/`<wallet-id>`/mbhd.wallet.aes |

### Windows

| Version | Wallet file location |
|---|---|
| **Multibit Classic** | C:\Users\\`<username>`\AppData\Roaming\MultiBit\\`<wallet-name>`.wallet |
| **MultibitHD** | C:\Users\\`<username>`\AppData\Roaming\MultiBitHD\`<wallet-id>`\mbhd.wallet.aes |


`<wallet-id>` is a very long, random directory name that acts as a
globally unique identifier for a wallet. It is starts with `mbhd-`
followed by a long string of letters, numbers and dashes. You will have
one directory like this for each wallet.

`<wallet-name>` is the name that you gave the wallet when you created
it. You will have a ``<wallet-name>`.wallet` file for each wallet.

`<username>` is your windows user name.

Once you figure out the name and location of your wallet file, you can
export the keys.

Exporting Your Keys
-------------------
Open a command prompt and type the following command:

```mbexport <path-to-wallet-file>```

For example, if you are using Multibit HD on MacOS, you would type
something like:

```mbexport ~/Library/Application\ Support/MultiBitHD/mbhd-aff7bb4a-8a5d9101-e7e97974-f999c7fb-53795c76/mbhd.wallet.aes```

TIP: If you can find the wallet file in the file explorer application,
you can type ```mbexport ``` in the command prompt, then drag the file
from explorer to the command prompt. It should fill in the long file
name for you.

When you run ```mbexport```, it will ask you to enter the passphrase
for your wallet. Once you do will list any private keys and mnemonic
seeds that it finds in the file. If you run ```mbexport``` on a
Multibit Classic file, the output will look simliar to this:

![Example output for Multibit Classic]("https://github.com/bgok/read-multibit-wallet-file/raw/master/readme-assets/classic-output.png")

For Multibit HD, it will look like:

![Example output for MultibitHD]("https://github.com/bgok/read-multibit-wallet-file/raw/master/readme-assets/hd-output.png")


Multibit (Classic)
==================

Importing to Electrum
---------------------


MultibitHD
==========

Exporting your Keys
-------------------

Importing to Electrum
---------------------

Importing to Bread Wallet
-------------------------


