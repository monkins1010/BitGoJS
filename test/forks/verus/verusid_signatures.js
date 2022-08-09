/* global describe, it */

var assert = require('assert')
var ECPair = require('../../../src/ecpair')

const {
  IdentitySignature,
  networks
} = require('../../../src')

describe('VerusID Signer and Verifier (verustest)', function () {
  var network = networks['verustest']

  it("Sign and verify message with VerusID version 1 signatures", function () {
    const version = 1;
    const hashType = 1;
    const blockHeight = 9710;
    const signatures = null;
    const chainId = "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq";
    const iAddress = "i8jHXEEYEQ7KEoYe6eKXBib8cUBZ6vjWSd";
    const msg = "signedmessage"
    const keyPair = ECPair.fromWIF('UrEJQMk9PD4Fo9i8FNb1ZSFRrC9TrD4j6CGbFvbFHVH83bStroHH', network)

    const sig = new IdentitySignature(version, hashType, blockHeight, signatures, chainId, iAddress)
    sig.signMessageOffline(msg, keyPair)
    const verificationResult = sig.verifyMessageOffline(msg, keyPair)

    assert.equal(
      sig.toBuffer().toString("base64"),
      "Ae4lAAABQR/nlqcG/y90PPT3/SH435hmsrbv0GUEWlzR32Db5ynj/FfRfSt3SvbpRwlRAWNMOYgZkJFNeIgWnxKGXpJVpMc4"
    );
    assert.equal(verificationResult, true);
  });

  it("Verify version 1 signature", function () {
    const sig = new IdentitySignature()
    const chainId = "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq";
    const iAddress = "i8jHXEEYEQ7KEoYe6eKXBib8cUBZ6vjWSd";
    const msg = "signedmessage"

    sig.fromBuffer(
      Buffer.from(
        "Ae4lAAABQR/nlqcG/y90PPT3/SH435hmsrbv0GUEWlzR32Db5ynj/FfRfSt3SvbpRwlRAWNMOYgZkJFNeIgWnxKGXpJVpMc4",
        "base64"
      ),
      0,
      chainId,
      iAddress
    );

    assert.equal(
      sig.verifyMessageOffline(
        msg,
        ECPair.fromPublicKeyBuffer(
          Buffer.from("032590d45225afaffdc2019af4d8b9ce670663fbec7b45752ecbe3ba9ce76369ae", "hex"),
          network
        )
      ),
      true
    );
    assert.equal(
      sig.verifyMessageOffline(
        msg,
        ECPair.fromPublicKeyBuffer(
          Buffer.from("031b37caff743cddcf50089b294ea48b63abe983f15c3047e47307f6004a97dd19", "hex"),
          network
        )
      ),
      false
    );
  });
})
