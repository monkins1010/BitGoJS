/* global describe, it */

var assert = require('assert')
var ECPair = require('../../../src/ecpair')

const {
  IdentitySignature,
  networks
} = require('../../../src')

describe.only('VerusID Signer and Verifier (verustest)', function () {
  var network = networks['verustest']
  const keyPair = ECPair.fromWIF('UrEJQMk9PD4Fo9i8FNb1ZSFRrC9TrD4j6CGbFvbFHVH83bStroHH', network)

  it("Sign and verify message with VerusID version 1 signatures", function () {
    const version = 1;
    const hashType = 1;
    const blockHeight = 9710;
    const signatures = null;
    const chainId = "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq";
    const iAddress = "i8jHXEEYEQ7KEoYe6eKXBib8cUBZ6vjWSd";
    const msg = "signedmessage"

    const sig = new IdentitySignature(network, version, hashType, blockHeight, signatures, chainId, iAddress)
    sig.signMessageOffline(msg, keyPair)
    const verificationResult = sig.verifyMessageOffline(msg, keyPair.getAddress())[0]

    assert.equal(
      sig.toBuffer().toString("base64"),
      "Ae4lAAABQR/nlqcG/y90PPT3/SH435hmsrbv0GUEWlzR32Db5ynj/FfRfSt3SvbpRwlRAWNMOYgZkJFNeIgWnxKGXpJVpMc4"
    );
    assert.equal(verificationResult, true);
  });

  it("Verify version 1 signature", function () {
    const sig = new IdentitySignature(network)
    const chainId = "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq";
    const iAddress = "i8jHXEEYEQ7KEoYe6eKXBib8cUBZ6vjWSd";
    const msg = "signedmessage"
    const wrongmsg = "notsignedmessage"

    sig.fromBuffer(
      Buffer.from(
        "Ae4lAAABQR/nlqcG/y90PPT3/SH435hmsrbv0GUEWlzR32Db5ynj/FfRfSt3SvbpRwlRAWNMOYgZkJFNeIgWnxKGXpJVpMc4",
        "base64"
      ),
      0,
      chainId,
      iAddress
    );

    //DELET
    console.log(sig.toBuffer().toString('base64'))

    assert.equal(
      sig.verifyMessageOffline(
        msg,
        keyPair.getAddress()
      )[0],
      true
    );
    assert.equal(
      sig.verifyMessageOffline(
        wrongmsg,
        keyPair.getAddress()
      )[0],
      false
    );
  });
})
