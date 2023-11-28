import * as BN from 'bn.js'
import * as assert from "assert"
import {Polynomial} from './polynomial'

type TCurve = any
type TCurvePoint = any

const ZERO = new BN('0', 10)

export namespace Vsss {

    /**
     * Make shares of 'secret'
     *
     * @param secret
     * @param threshold
     * @param shareIndexs
     *
     *        [new BN('1',10),
     *         new BN('2',10),
     *         new BN('3',10),
     *         new BN('4',10)]
     *
     * @param n
     * @param prime
     * @returns {Promise<[[shareIndex1, share1], [shareIndex2, share2],[shareIndex3, share3],]>}
     */
    export async function makeShares(secret: BN, threshold: number, shareIndexs: BN[], n: number, prime: BN): Promise<[BN, BN][]> {
        assert(shareIndexs.length === n)
        let poly = await Polynomial.randomPolynomialWithA0(secret, threshold, prime)
        return poly.getPoints(shareIndexs)
    }

    /**
     * Make shares of 'secret'
     *
     * @param secret
     * @param threshold
     * @param shareIndexs
     *
     *        [new BN('1',10),
     *         new BN('2',10),
     *         new BN('3',10),
     *         new BN('4',10)]
     *
     * @param secret
     * @param threshold
     * @param shareIndexs
     * @param n
     * @param prime
     * @param curve
     * @returns {Promise<[[shareIndex1, share1], [shareIndex2, share2],[shareIndex3, share3],[c0,c1,ct]]>}
     */
    export async function makeSharesWithCommits(secret: BN, threshold: number, shareIndexs: BN[], n: number, prime: BN, curve: TCurve): Promise<[[BN, BN][], TCurvePoint[]]> {
        assert(shareIndexs.length === n)
        let poly = await Polynomial.randomPolynomialWithA0(secret, threshold, prime)
        let points = poly.getPoints(shareIndexs)
        let commits = poly.getCommits(curve)
        return [points, commits]
    }

    /**
     * Verify share in Feldman's scheme
     *
     * @param commits
     * @param shareIndex
     * @param share
     * @param curve
     * @returns {boolean}
     */
    export function verifyShare(commits: TCurvePoint[], shareIndex: BN, share: BN, curve: TCurve): boolean {
        return Polynomial.verifyCommits(commits, shareIndex, share, curve)
    }

    /**
     * Recover secret
     *
     * @param threshold
     * @param shares
     * @param prime
     * @returns {secret}
     */
    export function recoverSecret(threshold: number, shares: [BN, BN][], prime: BN): BN {
        assert(threshold === shares.length)
        return Polynomial.lagrangeInterpolate(ZERO, threshold, shares, prime)
    }

}
