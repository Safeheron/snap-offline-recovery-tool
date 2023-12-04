import * as BN from 'bn.js'
import * as assert from "assert"
import {Polynomial} from './polynomial'
import {Rand, Prime} from "@safeheron/crypto-rand"
import {Hex} from "@safeheron/crypto-utils"
import * as elliptic from 'elliptic'
const curve = elliptic.curves['secp256k1']
import * as bip39 from 'bip39'
import {VsssSecp256k1} from "./vsssSecp256k1";

type TCurve = any
type TCurvePoint = any


const ZERO = new BN('0', 10)

export namespace RecoveryTools{

    export const MaxBN = curve.n
    /**
     * Recover private key
     *
     * @param threshold
     * @param indexArr
     * @param mnemoArr
     *
     * @returns {privateKey}
     */
    export function RecoveryKeyFromShares(threshold: number, indexArr: BN[], mnemoArr: string[]): string {
        if(indexArr.length != mnemoArr.length) throw "indexArr.length != mnemoArr.length"
        if(mnemoArr.length < threshold ) throw "Need more shares!"
        let shares: [BN, BN][] = []
        for (let i = 0; i < indexArr.length; i++) {
            let shareHex = bip39.mnemonicToEntropy(mnemoArr[i])
            let shareValue = new BN(shareHex, 16)
            shares.push([indexArr[i], shareValue])
        }
        let privateKey: BN = VsssSecp256k1.recoverSecret(threshold, shares)
        let privateKeyHex: string = Hex.pad64(privateKey.toString(16))
        return privateKeyHex
    }


}