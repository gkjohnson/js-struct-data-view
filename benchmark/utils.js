function pad(str, len) {

    let res = str;
    while (res.length < len) {

        res += ' ';

    }

    return res;

}

module.exports = {};
module.exports.runBenchmark = function(name, func, maxTime, maxIterations = Infinity) {

    let iterations = 0;
    const start = Date.now();
    while (Date.now() - start < maxTime) {

        func();
        iterations++;
        if (iterations >= maxIterations) break;

    }
    const elapsed = Date.now() - start;

    console.log(`${ pad(name, 25) }: ${ parseFloat((elapsed / iterations).toFixed(6)) } ms`);

};
