const {
    getStruct, StructArray,
    StructDefinition, ScalarMember, FixedLengthArrayMember,
} = require('../umd/index.js');

const { runBenchmark } = require('./utils.js');

const COUNT = 100000;
const arrayBuffer = new ArrayBuffer(
    (4 + 4 + 8 + 8 * 5) * COUNT
);
const def = new StructDefinition(
    new ScalarMember('a', 'uint32'),
    new ScalarMember('b', 'float32'),
    new ScalarMember('c', 'float64'),
    new FixedLengthArrayMember('arr', 'float64', 5),
);
const size = (4 + 4 + 8 + 8 * 5);
let tot = 0; // eslint-disable-line no-unused-vars

const structArray = new StructArray(arrayBuffer, def);
runBenchmark(
    'Struct Array Read',
    () => {
        for (let i = 0, l = structArray.length; i < l; i++) {
            tot += structArray[i].a;
        }
    },
    3000
);

const structArrayWithReuse = new StructArray(arrayBuffer, def, { reuseObject: true });
runBenchmark(
    'with Reused Target',
    () => {
        for (let i = 0, l = structArrayWithReuse.length; i < l; i++) {
            tot += structArrayWithReuse[i].a;
        }
    },
    3000
);

console.log('');

const cursor = { offset: 0 };
const dataView = new DataView(arrayBuffer);
runBenchmark(
    'DataView Helper',
    () => {
        cursor.offset = 0;
        for (let i = 0; i < COUNT; i++) {

            const res = getStruct(dataView, def, cursor.offset, {}, cursor);
            tot += res.a;

        }
    },
    3000
);

runBenchmark(
    'with Reused Target',
    () => {
        const tg = {};
        cursor.offset = 0;
        for (let i = 0; i < COUNT; i++) {

            const res = getStruct(dataView, def, cursor.offset, tg, cursor);
            tot += res.a;

        }
    },
    3000
);

console.log('');

runBenchmark(
    'DataView Read',
    () => {

        const tg = {
            a: 0,
            b: 0,
            c: 0,
            arr: [0, 0, 0, 0, 0],
        };
        for (let i = 0; i < COUNT; i++) {

            const offset = i * size;
            tg.a = dataView.getUint32(offset + 0);
            tg.b = dataView.getFloat32(offset + 4);
            tg.c = dataView.getFloat64(offset + 8);
            for (let j = 0; j < 5; j++) {

                tg.arr[j] = dataView.getFloat64(offset + 16 + j * 8);

                // tg.arr[j] = float64Array[i * offset64 + 2 + j];

            }

            tot += tg.a;

        }

    },
    3000
);

const uint32Array = new Uint32Array(arrayBuffer);
const float32Array = new Float32Array(arrayBuffer);
const float64Array = new Float64Array(arrayBuffer);
runBenchmark(
    'Typed Array Read',
    () => {
        const tg = {
            a: 0,
            b: 0,
            c: 0,
            arr: [0, 0, 0, 0, 0],
        };
        const offset32 = size / 4;
        const offset64 = size / 8;
        for (let i = 0; i < COUNT; i++) {

            tg.a = uint32Array[i * offset32 + 0];
            tg.b = float32Array[i * offset32 + 1];
            tg.c = float64Array[i * offset64 + 1];

            // tg.arr = new Float64Array(arrayBuffer, (i * offset64 + 2 + 0) * 8, 5);

            for (let j = 0; j < 5; j++) {

                tg.arr[j] = float64Array[i * offset64 + 2 + j];

            }

            tot += tg.a;

        }
    },
    3000
);

const objectArray = new Array(COUNT)
    .fill()
    .map(() => {
        return {
            a: 0,
            b: 0,
            c: 0,
            arr: [0, 0, 0, 0, 0],
        };
    });

runBenchmark(
    'Object Array Read',
    () => {
        for (let i = 0; i < COUNT; i++) {
            const ob = objectArray[i];
            tot += ob.a;
        }
    },
    3000
);
