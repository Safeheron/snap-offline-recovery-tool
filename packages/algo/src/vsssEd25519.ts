import * as BN from 'bn.js'
import * as assert from "assert"
import {Polynomial} from './polynomial'
import {Rand, Prime} from "@safeheron/crypto-rand"
import * as elliptic from 'elliptic'
const curve = elliptic.curves['ed25519']

type TCurve = any
type TCurvePoint = any

const ZERO = new BN('0', 10)


export namespace VsssEd25519 {

    export const MaxBN = curve.n

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
     * @returns {Promise<[[shareIndex1, share1], [shareIndex2, share2],[shareIndex3, share3]]>}
     */
    export async function makeShares(secret: BN, threshold: number, shareIndexs: BN[], n: number): Promise<[BN, BN][]> {
        assert(shareIndexs.length === n)
        let poly = await Polynomial.randomPolynomialWithA0(secret, threshold, curve.n)
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
     * @returns {Promise<[[shareIndex1, share1], [shareIndex2, share2],[shareIndex3, share3],[c0,c1,ct]]>}
     */
    export async function makeSharesWithCommits(secret: BN, threshold: number, shareIndexs: BN[], n: number): Promise<[[BN, BN][], TCurvePoint[]]> {
        assert(shareIndexs.length === n)
        let poly = await Polynomial.randomPolynomialWithA0(secret, threshold, curve.n)
        let points = poly.getPoints(shareIndexs)
        let commits = poly.getCommits(curve)
        return [points, commits]
    }

    /**
     * Make random coefficient array for a polynomial
     * @param threshold
     * @returns {Promise<[]>}
     */
    export async function makeRandomCoeArray(threshold: number): Promise<BN[]> {
        let coefficients = []
        for (let i = 1; i < threshold; i++) {
            let ai = await Rand.randomBNLt(curve.n)
            coefficients.push(ai)
        }
        return coefficients
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
     * @param coeArray
     *
     *        [new BN('1',10),
     *         new BN('2',10),
     *         new BN('3',10),
     *         new BN('4',10)]
     *
     * @returns {Promise<[[shareIndex1, share1], [shareIndex2, share2],[shareIndex3, share3],[c0,c1,ct]]>}
     */
    export async function makeSharesWithCommitsOnCoefficients(secret: BN, threshold: number, shareIndexs: BN[], n: number, coeArray: BN[]): Promise<[[BN, BN][], TCurvePoint[]]> {
        assert(shareIndexs.length === n)
        let poly = await Polynomial.randomPolynomialWithA0AndCoefficients(secret, threshold, curve.n, coeArray)
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
     * @returns {boolean}
     */
    export function verifyShare(commits: TCurvePoint[], shareIndex: BN, share: BN): boolean {
        return Polynomial.verifyCommits(commits, shareIndex, share, curve)
    }


    /**
     * Recover secret
     *
     * @param threshold
     * @param shares
     * @returns {secret}
     */
    export function recoverSecret(threshold: number, shares: [BN, BN][]): BN {
        assert(threshold <= shares.length)
        return Polynomial.lagrangeInterpolate(ZERO, threshold, shares, curve.n)
    }
}
