import * as BN from 'bn.js'
import * as assert from "assert"
import {Rand, Prime} from "@safeheron/crypto-rand"
import {Polynomial, Vsss, VsssEd25519, VsssSecp256k1, RecoveryTools} from ".."
import * as elliptic from 'elliptic'
import * as bip39 from 'bip39'
import {Hex} from "@safeheron/crypto-utils"

async function generate_shares_2_3(): Promise<[string, [BN, string][]]>{
    let ret_shares = []
    let threshold = 2
    let n = 3
    let secret = await Rand.randomBNLt(VsssSecp256k1.MaxBN)
    let shareIndexs = [
        new BN('1', 10),
        new BN('2', 10),
        new BN('3', 10),
    ]

    let privateKeyHex: string = Hex.pad64(secret.toString(16))
    console.log('- privateKeyHex = ', privateKeyHex)
    let shares = await VsssSecp256k1.makeShares(secret, threshold, shareIndexs, n)
    for( let i = 0; i < shares.length; i ++){
        let mnemo = bip39.entropyToMnemonic(Hex.pad64(shares[i][1].toString(16)))
        console.log('- share ', i, ' : [', shares[i][0].toString(), ", ", mnemo, "]\n")
        ret_shares.push([shares[i][0], mnemo])
    }
    return [privateKeyHex, ret_shares]
}


describe('Test Vsss:', function () {
    it('Test VsssSecp256k1 without commitments', async function () {
        let threshold = 2
        let [expectedPrivateKeyHex, shares] = await generate_shares_2_3()
        let indexArr: BN[] = [shares[0][0], shares[1][0], shares[2][0]]
        let mnemoArr: string[] = [shares[0][1], shares[1][1], shares[2][1]]
        let privateKeyHex = RecoveryTools.RecoveryKeyFromShares(threshold, indexArr, mnemoArr)
        console.log('- privateKeyHex = ', privateKeyHex)
        assert(expectedPrivateKeyHex === privateKeyHex)
    })

})
