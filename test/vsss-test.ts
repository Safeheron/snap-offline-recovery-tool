import * as BN from 'bn.js'
import * as assert from "assert"
import {Rand, Prime} from "@safeheron/crypto-rand"
import {Polynomial, Vsss, VsssEd25519, VsssSecp256k1} from ".."
import * as elliptic from 'elliptic'

describe('Test Polynomial:', function () {
    it('Test Polynomial!', async function () {
        let threshold = 2
        let a0 = new BN('123456', 10)
        let ZERO = new BN('0', 10)
        let ONE = new BN('1', 10)
        let TWO = new BN('2', 10)
        let THREE = new BN('3', 10)
        let prime = new BN('170141183460469231731687303715884105727', 10)
        let curve = elliptic.curves['secp256k1']
        let poly = await Polynomial.randomPolynomialWithA0(a0, threshold, prime)
        let points = poly.getPoints([ONE,TWO,THREE])
        let commits = poly.getCommits(curve)
        for( let i = 0; i < points.length; i ++){
            console.log('-point ', i, ': x=', points[i][0].toString(), ", y=", points[i][1].toString())
        }
        for( let i = 0; i < commits.length; i ++){
            console.log('-commit', i, ': x=', commits[i].x.toString(), ", y=", commits[i].y.toString())
        }
        let r = Polynomial.lagrangeInterpolate(ZERO, threshold, [points[0], points[1]], prime )
        console.log('a0 = ', a0.toString())
        console.log('r = ', r.toString())
        assert(a0.eq(r), "should equal")
        assert(Polynomial.verifyCommits(commits, ONE, points[0][1], curve), "should equal")
    })


    it('Very interesting!', async function () {
        let threshold = 3
        let secret = new BN('88985120633792790105905686761572077713049967498756747774697023364147812997770', 10)
        let coeArray = [
            secret,
            new BN('23203186230977131819040799943525784228350161592352764700770393913467426504596', 10),
            new BN('32876615466846773396430255826519221705134935388383681347755608907614570370613', 10)
        ]
        let shareIndexs = [
            await new BN('1', 10),
            await new BN('2', 10),
            await new BN('3', 10),
            await new BN('4', 10),
        ]

        let r = Polynomial.lagrangeInterpolate(new BN('0', 10), threshold, [
                [new BN('1', 10), new BN('29272833094300499897805757522929175793697500200418289440617863043711648378642', 10)],
                [new BN('2', 10), new BN('35313776488501756482566339937324717284614903678847193802049920538504624500740', 10)],
                [new BN('3', 10), new BN('107107950816396559860187434004758702185802177934043460858993195848526741364064', 10)]
            ], VsssSecp256k1.MaxBN)
        assert(secret.eq(r))

        r = Polynomial.lagrangeInterpolate(new BN('0', 10), threshold, [
            [new BN('1', 10), new BN('81898553135751859342176868172161039724389996060204408970370164571669302009471', 10)],
            [new BN('2', 10), new BN('112386889087500599443810791270483197923552764790089026990551842303455365764529', 10)],
            [new BN('3', 10), new BN('64658039251722814987236471047850644457700709409335697452636893417987842768607', 10)]
        ], VsssSecp256k1.MaxBN)
        assert(secret.eq(r))
    })
})

describe('Test Vsss:', function () {
    it('Test Vsss without commitments!', async function () {
        let threshold = 2
        let n = 3
        let prime = new BN('170141183460469231731687303715884105727', 10)
        let secret = await Rand.randomBNLt(prime)
        let shareIndexs = [
            await Rand.randomBNLt(prime),
            await Rand.randomBNLt(prime),
            await Rand.randomBNLt(prime),
        ]
        let shares = await Vsss.makeShares(secret, threshold, shareIndexs, n, prime)
        for( let i = 0; i < shares.length; i ++){
            console.log('- share', i, ': x=', shares[i][0].toString(), ", y=", shares[i][1].toString())
        }
        let r = Vsss.recoverSecret(threshold, [shares[1], shares[2]], prime)
        console.log('secret = ', secret.toString())
        console.log('recovered = ', r.toString())
        assert(secret.eq(r), "should equal")
    })

    it('Test Vsss with commitments!', async function () {
        let threshold = 2
        let n = 3
        let curve = elliptic.curves['secp256k1']
        let prime = curve.n
        let secret = await Rand.randomBNLt(prime)
        let shareIndexs = [
            await Rand.randomBNLt(prime),
            await Rand.randomBNLt(prime),
            await Rand.randomBNLt(prime),
        ]
        let res = await Vsss.makeSharesWithCommits(secret, threshold, shareIndexs, n, prime, curve)
        let shares = res[0]
        let commits = res[1]
        for( let i = 0; i < shares.length; i ++){
            assert(Vsss.verifyShare(commits, shares[i][0], shares[i][1], curve))
            console.log('- share', i, ': x=', shares[i][0].toString(), ", y=", shares[i][1].toString())
        }
        let r = Vsss.recoverSecret(threshold, [shares[1], shares[2]], prime)
        console.log('secret = ', secret.toString())
        console.log('recovered = ', r.toString())
        assert(secret.eq(r), "should equal")
    })
})


describe('Test VsssSecp256k1:', function () {
    it('Test VsssSecp256k1 with commitments', async function () {
        let threshold = 3
        let n = 4
        let secret = await Rand.randomBNLt(VsssSecp256k1.MaxBN)
        let shareIndexs = [
            await Rand.randomBNLt(VsssSecp256k1.MaxBN),
            await Rand.randomBNLt(VsssSecp256k1.MaxBN),
            await Rand.randomBNLt(VsssSecp256k1.MaxBN),
            await Rand.randomBNLt(VsssSecp256k1.MaxBN),
        ]
        let res = await VsssSecp256k1.makeSharesWithCommits(secret, threshold, shareIndexs, n)
        let shares = res[0]
        let commits = res[1]
        for( let i = 0; i < shares.length; i ++){
            assert(VsssSecp256k1.verifyShare(commits, shares[i][0], shares[i][1]))
            console.log('- share', i, ': x=', shares[i][0].toString(), ", y=", shares[i][1].toString())
        }
        let r = VsssSecp256k1.recoverSecret(threshold, [shares[1], shares[2], shares[3]])
        console.log('secret = ', secret.toString())
        console.log('recovered = ', r.toString())
        assert(secret.eq(r), "should equal")
    })

    it('Test VsssSecp256k1 with commitments', async function () {
        let threshold = 3
        let n = 4
        let secret = await Rand.randomBNLt(VsssSecp256k1.MaxBN)
        let shareIndexs = [
            await new BN('11215191567436612581698706853077693559484434474568519238813925782335252862710', 16),
            await new BN('11215191567436612581698706853077693559484434474568519238813925782335252862711', 16),
            await new BN('11215191567436612581698706853077693559484434474568519238813925782335252862712', 16),
            await new BN('11215191567436612581698706853077693559484434474568519238813925782335252862713', 16),
        ]
        let res = await VsssSecp256k1.makeSharesWithCommits(secret, threshold, shareIndexs, n)
        let shares = res[0]
        let commits = res[1]
        for( let i = 0; i < shares.length; i ++){
            assert(VsssSecp256k1.verifyShare(commits, shares[i][0], shares[i][1]))
            console.log('- share', i, ': x=', shares[i][0].toString(), ", y=", shares[i][1].toString())
        }
        let r = VsssSecp256k1.recoverSecret(threshold, [shares[1], shares[2], shares[3]])
        console.log('secret = ', secret.toString())
        console.log('recovered = ', r.toString())
        assert(secret.eq(r), "should equal")
    })

    it('Test VsssSecp256k1 with coefficient and commitments', async function () {
        for (let k = 0; k < 10; k++) {
            let threshold = 3
            let n = 4
            let secret = await Rand.randomBNLt(VsssSecp256k1.MaxBN)
            let shareIndexs = [
                await new BN('11215191567436612581698706853077693559484434474568519238813925782335252862710', 16),
                await new BN('11215191567436612581698706853077693559484434474568519238813925782335252862711', 16),
                await new BN('11215191567436612581698706853077693559484434474568519238813925782335252862712', 16),
                await new BN('11215191567436612581698706853077693559484434474568519238813925782335252862713', 16),
            ]
            let coeArray = await VsssSecp256k1.makeRandomCoeArray(threshold)
            let res = await VsssSecp256k1.makeSharesWithCommitsOnCoefficients(secret, threshold, shareIndexs, n, coeArray)
            let shares = res[0]
            let commits = res[1]
            for (let i = 0; i < shares.length; i++) {
                assert(VsssSecp256k1.verifyShare(commits, shares[i][0], shares[i][1]))
                console.log('- share', i, ': x=', shares[i][0].toString(), ", y=", shares[i][1].toString())
            }
            let r = VsssSecp256k1.recoverSecret(threshold, [shares[1], shares[2], shares[3]])
            console.log('secret = ', secret.toString())
            console.log('recovered = ', r.toString())
            assert(secret.eq(r), "should equal")
        }
    })

    it('Test VsssSecp256k1 without commitments', async function () {
        let threshold = 3
        let n = 4
        let secret = await Rand.randomBNLt(VsssSecp256k1.MaxBN)
        let shareIndexs = [
            new BN('1', 10),
            new BN('2', 10),
            new BN('3', 10),
            new BN('4', 10),
        ]
        let shares = await VsssSecp256k1.makeShares(secret, threshold, shareIndexs, n)
        for( let i = 0; i < shares.length; i ++){
            console.log('- share', i, ': x=', shares[i][0].toString(), ", y=", shares[i][1].toString())
        }
        let r = VsssSecp256k1.recoverSecret(threshold, [shares[1], shares[2], shares[3]])
        console.log('secret = ', secret.toString())
        console.log('recovered = ', r.toString())
        assert(secret.eq(r), "should equal")
    })

    it('Interesting Example', async function () {
        let threshold = 3
        let n = 4
        let secret = new BN('88985120633792790105905686761572077713049967498756747774697023364147812997770', 10)
        let shareIndexs = [
            new BN('1', 16),
            new BN('2', 16),
            new BN('3', 16),
            new BN('4', 16),
        ]
        let res = await VsssSecp256k1.makeSharesWithCommitsOnCoefficients(secret, threshold, shareIndexs, n, [
            new BN('23203186230977131819040799943525784228350161592352764700770393913467426504596', 10),
            new BN('32876615466846773396430255826519221705134935388383681347755608907614570370613', 10)
        ])
        let shares = res[0]
        let commits = res[1]
        for( let i = 0; i < shares.length; i ++){
            console.log('- share', i, ': x=', shares[i][0].toString(), ", y=", shares[i][1].toString())
        }
        for( let i = 0; i < commits.length; i ++){
            console.log('- commit', i, ': x=', commits[i].x.toString(), ", y=", commits[i].y.toString())
        }
        let r = VsssSecp256k1.recoverSecret(threshold, [shares[1], shares[2], shares[3]])
        console.log('secret = ', secret.toString())
        console.log('recovered = ', r.toString())
        assert(secret.eq(r), "should equal")
    })

    describe('Test VsssEd25519:', function () {
        it('Test VsssEd25519 with commitments', async function () {
            let threshold = 3
            let n = 4
            let secret = await Rand.randomBNLt(VsssEd25519.MaxBN)
            let shareIndexs = [
                await Rand.randomBNLt(VsssEd25519.MaxBN),
                await Rand.randomBNLt(VsssEd25519.MaxBN),
                await Rand.randomBNLt(VsssEd25519.MaxBN),
                await Rand.randomBNLt(VsssEd25519.MaxBN),
            ]
            let res = await VsssEd25519.makeSharesWithCommits(secret, threshold, shareIndexs, n)
            let shares = res[0]
            let commits = res[1]
            for( let i = 0; i < shares.length; i ++){
                assert(VsssEd25519.verifyShare(commits, shares[i][0], shares[i][1]))
                console.log('- share', i, ': x=', shares[i][0].toString(), ", y=", shares[i][1].toString())
            }
            let r = VsssEd25519.recoverSecret(threshold, [shares[1], shares[2], shares[3]])
            console.log('secret = ', secret.toString())
            console.log('recovered = ', r.toString())
            assert(secret.eq(r), "should equal")
        })

        it('Test VsssEd25519 with commitments', async function () {
            let threshold = 3
            let n = 4
            let secret = await Rand.randomBNLt(VsssEd25519.MaxBN)
            let shareIndexs = [
                await new BN('11215191567436612581698706853077693559484434474568519238813925782335252862710', 16),
                await new BN('11215191567436612581698706853077693559484434474568519238813925782335252862711', 16),
                await new BN('11215191567436612581698706853077693559484434474568519238813925782335252862712', 16),
                await new BN('11215191567436612581698706853077693559484434474568519238813925782335252862713', 16),
            ]
            let res = await VsssEd25519.makeSharesWithCommits(secret, threshold, shareIndexs, n)
            let shares = res[0]
            let commits = res[1]
            for( let i = 0; i < shares.length; i ++){
                assert(VsssEd25519.verifyShare(commits, shares[i][0], shares[i][1]))
                console.log('- share', i, ': x=', shares[i][0].toString(), ", y=", shares[i][1].toString())
            }
            let r = VsssEd25519.recoverSecret(threshold, [shares[1], shares[2], shares[3]])
            console.log('secret = ', secret.toString())
            console.log('recovered = ', r.toString())
            assert(secret.eq(r), "should equal")
        })

        it('Test VsssEd25519 with coefficient and commitments', async function () {
            for (let k = 0; k < 10; k++) {
                let threshold = 3
                let n = 4
                let secret = await Rand.randomBNLt(VsssEd25519.MaxBN)
                let shareIndexs = [
                    await new BN('11215191567436612581698706853077693559484434474568519238813925782335252862710', 16),
                    await new BN('11215191567436612581698706853077693559484434474568519238813925782335252862711', 16),
                    await new BN('11215191567436612581698706853077693559484434474568519238813925782335252862712', 16),
                    await new BN('11215191567436612581698706853077693559484434474568519238813925782335252862713', 16),
                ]
                let coeArray = await VsssEd25519.makeRandomCoeArray(threshold)
                let res = await VsssEd25519.makeSharesWithCommitsOnCoefficients(secret, threshold, shareIndexs, n, coeArray)
                let shares = res[0]
                let commits = res[1]
                for (let i = 0; i < shares.length; i++) {
                    assert(VsssEd25519.verifyShare(commits, shares[i][0], shares[i][1]))
                    console.log('- share', i, ': x=', shares[i][0].toString(), ", y=", shares[i][1].toString())
                }
                let r = VsssEd25519.recoverSecret(threshold, [shares[1], shares[2], shares[3]])
                console.log('secret = ', secret.toString())
                console.log('recovered = ', r.toString())
                assert(secret.eq(r), "should equal")
            }
        })

        it('Test VsssEd25519 without commitments', async function () {
            let threshold = 3
            let n = 4
            let secret = await Rand.randomBNLt(VsssEd25519.MaxBN)
            let shareIndexs = [
                new BN('1', 10),
                new BN('2', 10),
                new BN('3', 10),
                new BN('4', 10),
            ]
            let shares = await VsssEd25519.makeShares(secret, threshold, shareIndexs, n)
            for( let i = 0; i < shares.length; i ++){
                console.log('- share', i, ': x=', shares[i][0].toString(), ", y=", shares[i][1].toString())
            }
            let r = VsssEd25519.recoverSecret(threshold, [shares[1], shares[2], shares[3]])
            console.log('secret = ', secret.toString())
            console.log('recovered = ', r.toString())
            assert(secret.eq(r), "should equal")
        })

    })
})
