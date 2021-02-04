Preface
============
This is a fork of https://github.com/Multibit-Legacy/read-multibit-wallet-file that includes 
a fix for the `TypeError: Cannot read property 'fromPrivate' of undefined` error (and maybe a few others) mentioned in [this thread](https://github.com/Multibit-Legacy/read-multibit-wallet-file/pull/1). Although I have a [pull request](https://github.com/Multibit-Legacy/read-multibit-wallet-file/pull/2) pending with this fix, the original project seems to be abandoned. Everything below is from the original project's `readme` except for where I renamed `mbexport` to `mbexport-rd` (as that is the npm package with this fix).

---
---

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
   ```npm install -g mbexport-rd```

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
| **MultibitHD** | C:\Users\\`<username>`\AppData\Roaming\MultiBitHD\\`<wallet-id>`\mbhd.wallet.aes |


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
===================
Open a command prompt and type the following command:

```mbexport-rd <path-to-wallet-file>```

For example, if you are using Multibit HD on MacOS, you would type
something like:

```mbexport-rd ~/Library/Application\ Support/MultiBitHD/mbhd-aff7bb4a-8a5d9101-e7e97974-f999c7fb-53795c76/mbhd.wallet.aes```

TIP: If you can find the wallet file in the file explorer application,
you can type ```mbexport-rd ``` in the command prompt, then drag the file
from explorer to the command prompt. It should fill in the long file
name for you.

When you run ```mbexport-rd```, it will ask you to enter the passphrase
for your wallet. Once you do will list any private keys and mnemonic
seeds that it finds in the file. If you run ```mbexport-rd``` on a
Multibit Classic file, the output will look simliar to this:

```
multibit classic wallet opened
Enter your passphrase: ***

L5PUQVHfdaHmV8z4u4572ATv2EUiLhZDnMrp5QUBCqiMzJxr5gYL
```

For Multibit HD, it will look like:

```
MultibitHD wallet opened
Enter your passphrase: ***

measure swim globe radio reunion awful reflect tail produce treat cluster spot
```


````
This tool and these instructions are distributed under the MIT License

Copyright (c) 2017 Ken Heutmaker

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
````
