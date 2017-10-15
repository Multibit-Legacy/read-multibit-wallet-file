# Issue 01
## some .wallet files can not be read!

About 70% of my multibit.wallet files can be read just fine, and I have many of my private keys now - thanks a lot.

However, about 1/3 show this error instead:

```
mbexport 20141210_lalala.wallet
multibit classic wallet opened
Enter your passphrase: (node:24833) MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 end listeners added. Use emitter.setMaxListeners() to increase limit
(node:24833) MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 drain listeners added. Use emitter.setMaxListeners() to increase limit
(node:24833) MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 error listeners added. Use emitter.setMaxListeners() to increase limit
(node:24833) MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 close listeners added. Use emitter.setMaxListeners() to increase limit
(node:24833) MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 keypress listeners added. Use emitter.setMaxListeners() to increase limit
```

It happens BEFORE I can input any passphrase.

When I ignore it, and still input a passphrase  

every single letter results in ************************************************************  

and   

pressing enter results in the screen being cleared, and then after a while:  

```
(node:25196) UnhandledPromiseRejectionWarning: Unhandled promise rejection (rejection id: 1): Error: error:06065064:digital envelope routines:EVP_DecryptFinal_ex:bad decrypt
(node:25196) [DEP0018] DeprecationWarning: Unhandled promise rejections are deprecated. In the future, promise rejections that are not handled will terminate the Node.js process with a non-zero exit code.
```

