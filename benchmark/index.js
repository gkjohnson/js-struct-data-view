const {
    getStruct, StructArray,
    StructDefinition, ScalarMember, FixedLengthArrayMember,
    createReadStructFunction, createReadStructFromArrayBufferFunction,
} = require('../umd/index.js');

const { runBenchmark } = require('./utils.js');

const COUNT = 100000;

const def = new StructDefinition(
    new ScalarMember('a', 'uint32'),
    new ScalarMember('b', 'float32'),
    new ScalarMember('c', 'float64'),
    new FixedLengthArrayMember('arr', 'float64', 5),
    new FixedLengthArrayMember('nest',
        new StructDefinition(
            new ScalarMember('a', 'uint32'),
            new ScalarMember('b', 'float32'),
        ),
        2
    )
);
const size = (4 + 4 + 8 + 8 * 5 + 8 * 2);
const arrayBuffer = new ArrayBuffer(
    size * COUNT
);
const cursor = { offset: 0 };
const dataView = new DataView(arrayBuffer);

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

let readFunc = createReadStructFunction(def);
runBenchmark(
    'Generated function',
    () => {
        cursor.offset = 0;
        for (let i = 0; i < COUNT; i++) {

            const res = readFunc(dataView, cursor.offset, {}, cursor);
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

            const res = readFunc(dataView, cursor.offset, tg, cursor);
            tot += res.a;

        }
    },
    3000
);

console.log('');

readFunc = createReadStructFromArrayBufferFunction(def, arrayBuffer);
runBenchmark(
    'Generated Typed Array Func',
    () => {
        cursor.offset = 0;
        for (let i = 0; i < COUNT; i++) {

            const res = readFunc(cursor.offset, {}, cursor);
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

            const res = readFunc(cursor.offset, tg, cursor);
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
            nest: [{ a: 0, b: 0 }, { a: 0, b: 0 }],
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

            for (let j = 0; j < 2; j++) {

                tg.nest[j].a = dataView.getUint32(offset + 56 + j * 8 + 0);
                tg.nest[j].b = dataView.getFloat32(offset + 56 + j * 8 + 4);

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
            nest: [{ a: 0, b: 0 }, { a: 0, b: 0 }],
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

            for (let j = 0; j < 2; j++) {

                tg.nest[j].a = uint32Array[i * offset32 + 14 + j * 2];
                tg.nest[j].b = float32Array[i * offset32 + 14 + j * 2 + 1];

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
            nest: [{ a: 0, b: 0 }, { a: 0, b: 0 }],
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
