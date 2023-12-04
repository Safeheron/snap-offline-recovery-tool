import * as BN from 'bn.js'
import * as assert from "assert"
import {Rand, Prime} from "@safeheron/crypto-rand"

type TCurve = any
type TCurvePoint = any

export class Polynomial {
    public coefficients: BN []
    public prime: BN

    /**
     * @param coefficients
     * @param prime
     * @constructor
     */
    public constructor(coefficients: BN [], prime: BN){
        this.coefficients = coefficients
        this.prime = prime
    }

    /**
     * Generate a random polynomial
     * @param a0
     * @param threshold
     * @param prime
     * @returns {Promise<Polynomial>}
     */
    public static async randomPolynomialWithA0(a0: BN, threshold: number, prime: BN): Promise<Polynomial> {
        let coefficients = [a0]
        for(let i = 1; i < threshold; i ++){
            let ai = await Rand.randomBNLt(prime)
            coefficients.push(ai)
        }
        return new Polynomial(coefficients, prime)
    }


    /**
     * Generate a random polynomial
     * @param a0
     * @param threshold
     * @param prime
     * @param coeArra   array of coefficients
     * @returns {Promise<Polynomial>}
     */
    public static async randomPolynomialWithA0AndCoefficients(a0: BN, threshold: number, prime: BN, coeArray: BN[]): Promise<Polynomial> {
        let coefficients = [a0]
        for(let i = 0; i < coeArray.length; i ++){
            coefficients.push(coeArray[i])
        }
        return new Polynomial(coefficients, prime)
    }


    /**
     * Polynomial Interpolation
     *
     * Interpolation polynomial in the Lagrange form
     * Given a set of k + 1 data points:
     *     (x0, x1), ... , (xj,yj), ... , (xk,yk)
     * L(x) = \Sigma_{j=0}^k{yj lj(x)}
     * lj(x) = \Pi_{0<=m<=k, m!=j}{(x-xm)/(xj-xm)}
     *
     * @param x
     * @param threshold
     * @param points
     * @param prime
     * @returns {L(x)}
     */
    public static lagrangeInterpolate(x: BN, threshold: number, points: [BN, BN][], prime: BN): BN {
        assert(threshold <= points.length)
        let ctx = BN.red(prime)
        x = x.toRed(ctx)
        let y = new BN('0', 10).toRed(ctx)
        for (let j = 0; j < threshold; j++) {
            let xj = points[j][0].toRed(ctx)
            let yj = points[j][1].toRed(ctx)
            let num = new BN('1', 10).toRed(ctx)
            let den = new BN('1', 10).toRed(ctx)
            for (let m = 0; m < threshold; m++) {
                if(m !== j){
                    let xm = points[m][0].toRed(ctx)
                    // @ts-ignore
                    num = num.redMul(x.redSub(xm))
                    den = den.redMul(xj.redSub(xm))
                }
            }
            let lj = yj.redMul(num).redMul(den.redInvm())
            y = y.redAdd(lj)
        }
        return y.fromRed()
    }

    /**
     * Get point at 'x'
     *
     * User Honer's rule
     * f(x) = a0 + a1x + a2x^2 + ... + anx^n
     * This can, also, be written as:
     * f(x) = a0 + x(a1 + x(a2 + x(a3 + ... + x(an-1 + anx)....)
     * f(x) = a0 + x(a1 + x(a2 + x(a3 + ... + x(an-1 + x(an + x*0))....)
     *
     * @param x
     * @returns {[x, y]}
     */
    public getPoint(x: BN): [BN, BN] {
        // ***** Very interesting *****
        // let ctx = BN.red(this.prime)
        // let r = new BN('1', 10).toRed(ctx)
        // let threshold = this.coefficients.length
        // for(let i = 1; i < threshold; i++){
        //    r = r.redMul(this.coefficients[threshold-i].toRed(ctx))
        //        .redMul(x.toRed(ctx))
        //        .redAdd(this.coefficients[threshold-i-1].toRed(ctx))
        // }
        // return [x, r.fromRed()]

        let ctx = BN.red(this.prime)
        let r = new BN('0', 10).toRed(ctx)
        let threshold = this.coefficients.length
        for(let i = threshold - 1; i >= 0; i--){
            r = r.redMul(x.toRed(ctx))
                .redAdd(this.coefficients[i].toRed(ctx))
        }
        return [x, r.fromRed()]
    }

    /**
     * Get points at x-Array
     * @param xArray
     * @returns {[[x0,y0][x1,y1]...[xn,yn]]}
     */
    public getPoints(xArray: BN[]): [BN, BN][] {
        let points = []
        xArray.forEach( (x) => {
            points.push(this.getPoint(x))
        })
        return points
    }

    /**
     * Get Commits of the polynomial according to Feldman's scheme
     *
     * f(x) = a0 + a1x + a2x^2 + ... + anx^n
     *
     * c0 = g^a0
     * c1 = g^a1
     * ...
     * ct = g^at
     *
     *
     * @param x*
     * @param curve
     * @returns {[c0, c1, ... , ct]}
     */
    public getCommits(curve: TCurve): TCurvePoint[] {
        let threshold = this.coefficients.length
        let commits = []
        for( let i = 0; i < threshold; i++)
        commits.push(curve.g.mul(this.coefficients[i]))
        return commits
    }

    /**
     * Verify Commits of the polynomial according to Feldman's scheme
     *
     * f(x) = a0 + a1x + a2x^2 + ... + anx^n
     *
     * Verify g^y === c0 c1^{x} c2^{x^2} c3^{x^3}.... cn^{x^n}
     *
     *
     * @param commits:  [c0, c1, ... , ct]
     * @param x
     * @param y
     * @param curve
     * @returns {boolean}
     */
    public static verifyCommits(commits: TCurvePoint [], x: BN, y: BN, curve: TCurve): boolean {
        let threshold = commits.length
        let ctx = BN.red(curve.n)
        x = x.toRed(ctx)
        let gv = commits[0]
        for( let i = 1; i < threshold; i++){
            let iRed = new BN(i.toString(), 10)
            // @ts-ignore
            gv = gv.add(commits[i].mul(x.redPow(iRed)))
        }
        let gy = curve.g.mul(y)
        return gv.eq(gy)
    }

    /**
     * Polynomial Interpolation
     *
     * Interpolation polynomial in the Lagrange form
     * Given a array of k + 1 data points:
     *     (x0, ..., xj, ...., yk)
     * For points:
     *     (x0, y1), ... , (xj,yj), ... , (xk,yk)
     *
     * lj(x) = \Pi_{0<=m<=k, m!=j}{(x-xm)/(xj-xm)}
     *
     * @param x
     * @param xArray
     * @param prime
     * @returns {l0(x), ..., lj(x), ..., lk(x)}
     */
    public static getLArray(x: BN, xArray: BN[], prime: BN): BN[] {
        let lArray = []
        let ctx = BN.red(prime)
        x = x.toRed(ctx)
        for (let j = 0; j < xArray.length; j++) {
            let xj = xArray[j].toRed(ctx)
            let num = new BN('1', 10).toRed(ctx)
            let den = new BN('1', 10).toRed(ctx)
            for (let m = 0; m < xArray.length; m++) {
                if(m !== j){
                    let xm = xArray[m].toRed(ctx)
                    // @ts-ignore
                    num = num.redMul(x.redSub(xm))
                    den = den.redMul(xj.redSub(xm))
                }
            }
            let lj = num.redMul(den.redInvm())
            lArray.push(lj)
        }
        return lArray
    }

}
