/* global describe, it, expect */
const {
    getStruct, setStruct, nextStruct, StructArray,
    StructDefinition, ScalarMember, FixedLengthArrayMember,
    createReadStructFunction, createWriteStructFunction,
} = require('../umd/index.js');

describe('StructDefinition', () => {

    it('should be able to be created', () => {

        const def = new StructDefinition(
            new ScalarMember('sca', 'uint32', false),
            new FixedLengthArrayMember('arr', 'float64', 5, true),
        );

        expect(def.length).toBe(2);

        expect(def[0].name).toBe('sca');
        expect(def[0].type).toBe('uint32');
        expect(def[0].littleEndian).toBe(false);

        expect(def[1].name).toBe('arr');
        expect(def[1].type).toBe('float64');
        expect(def[1].length).toBe(5);
        expect(def[1].littleEndian).toBe(true);

    });

});

describe('Scalar Members', () => {

    it('should read and write to and from the ArrayBuffer', () => {

        const def = new StructDefinition(
            new ScalarMember('a', 'uint32', true),
            new ScalarMember('b', 'uint32', false),
            new ScalarMember('c', 'float64', false),
            new ScalarMember('d', 'float32', true),
        );

        const data = {
            a: 100,
            b: 200,
            c: -100.32,
            d: -200,
        };
        const dataView = new DataView(new ArrayBuffer(4 + 4 + 8 + 4));
        const cursor = { offset: 0 };
        setStruct(dataView, def, 0, data, cursor);

        expect(dataView.getUint32(0, true)).toBe(100);
        expect(dataView.getUint32(4, false)).toBe(200);
        expect(dataView.getFloat64(8, false)).toBe(-100.32);
        expect(dataView.getFloat32(16, true)).toBe(-200);
        expect(cursor.offset).toBe(20);

        cursor.offset = 0;
        const readData = getStruct(dataView, def, 0, {}, cursor);
        expect(readData).toEqual(data);
        expect(cursor.offset).toBe(20);

        const next = nextStruct(dataView, def, 0);
        expect(next).toBe(20);

    });

    it('should respect the offset', () => {

        const def = new StructDefinition(new ScalarMember('a', 'uint8'));
        const data = { a: 10 };
        const cursor = { offset: 0 };
        const dataView = new DataView(new ArrayBuffer(4 + 1));
        setStruct(dataView, def, 4, data, cursor);

        expect(dataView.getUint8(4)).toBe(10);
        expect(cursor.offset).toBe(5);

        cursor.offset = 0;
        const readData = getStruct(dataView, def, 4, {}, cursor);
        expect(readData).toEqual(data);
        expect(cursor.offset).toBe(5);

        const next = nextStruct(dataView, def, 4);
        expect(next).toBe(5);
    });

    it('should read and write nested structs', () => {

        const def = new StructDefinition(
            new ScalarMember('a', 'uint8'),
            new ScalarMember('b',
                new StructDefinition(
                    new ScalarMember('c', 'float64'),
                )
            ),
        );

        const data = {
            a: 100,
            b: {
                c: -10.2,
            },
        };
        const dataView = new DataView(new ArrayBuffer(1 + 8));
        const cursor = { offset: 0 };
        setStruct(dataView, def, 0, data, cursor);

        expect(dataView.getUint8(0)).toBe(100);
        expect(dataView.getFloat64(1)).toBe(-10.2);
        expect(cursor.offset).toBe(9);

        cursor.offset = 0;
        const readData = getStruct(dataView, def, 0, {}, cursor);
        expect(readData).toEqual(data);
        expect(cursor.offset).toBe(9);

        const next = nextStruct(dataView, def, 0);
        expect(next).toBe(9);

    });

});

describe('Fixed Length Array Members', () => {

    it('should read and write to and from the ArrayBuffer', () => {

        const def = new StructDefinition(
            new FixedLengthArrayMember('a', 'uint32', 3, true),
            new FixedLengthArrayMember('b', 'float64', 3, false),
        );

        const data = {
            a: [ 1, 2, 3 ],
            b: [ 1.1, 1.2, 1.3 ],
        };
        const dataView = new DataView(new ArrayBuffer(4 * 3 + 8 * 3));
        const cursor = { offset: 0 };

        setStruct(dataView, def, 0, data, cursor);
        expect(dataView.getUint32(0, true)).toBe(1);
        expect(dataView.getUint32(4, true)).toBe(2);
        expect(dataView.getUint32(8, true)).toBe(3);

        expect(dataView.getFloat64(12, false)).toBe(1.1);
        expect(dataView.getFloat64(20, false)).toBe(1.2);
        expect(dataView.getFloat64(28, false)).toBe(1.3);

        expect(cursor.offset).toBe(36);

        cursor.offset = 0;
        const readData = getStruct(dataView, def, 0, {}, cursor);
        expect(readData).toEqual(data);
        expect(cursor.offset).toBe(36);

        const next = nextStruct(dataView, def, 0);
        expect(next).toBe(36);

    });

    it('should respect the offset', () => {

        const def = new StructDefinition(new FixedLengthArrayMember('a', 'uint8', 1));
        const data = { a: [10] };
        const cursor = { offset: 0 };
        const dataView = new DataView(new ArrayBuffer(4 + 1));
        setStruct(dataView, def, 4, data, cursor);

        expect(dataView.getUint8(4)).toBe(10);
        expect(cursor.offset).toBe(5);

        cursor.offset = 0;
        const readData = getStruct(dataView, def, 4, {}, cursor);
        expect(readData).toEqual(data);
        expect(cursor.offset).toBe(5);

        const next = nextStruct(dataView, def, 4);
        expect(next).toBe(5);
    });

    it('should read and write an array of structs', () => {

        const def = new StructDefinition(
            new FixedLengthArrayMember(
                'a',
                new StructDefinition(
                    new ScalarMember('b', 'uint32'),
                    new FixedLengthArrayMember('c', 'float64', 2),
                ),
                2
            ));
        const data = {
            a: [{
                b: 10,
                c: [1.1, 1.2],
            }, {
                b: 20,
                c: [2.1, 2.2],
            }],
        };

        const cursor = { offset: 0 };
        const dataView = new DataView(new ArrayBuffer(2 * 4 + 4 * 8));

        setStruct(dataView, def, 0, data, cursor);

        expect(dataView.getUint32(0)).toBe(10);
        expect(dataView.getFloat64(4)).toBe(1.1);
        expect(dataView.getFloat64(12)).toBe(1.2);

        expect(dataView.getUint32(20)).toBe(20);
        expect(dataView.getFloat64(24)).toBe(2.1);
        expect(dataView.getFloat64(32)).toBe(2.2);

        expect(cursor.offset).toBe(40);

        cursor.offset = 0;
        const readData = getStruct(dataView, def, 0, {}, cursor);
        expect(readData).toEqual(data);
        expect(cursor.offset).toBe(40);

        const next = nextStruct(dataView, def, 0);
        expect(next).toBe(40);

    });
});

describe('Variable Length Array Members', () => {
    it.skip('should read and write to and from the ArrayBuffer', () => {});
});

describe('Strings', () => {
    it.skip('should read and write to and from the ArrayBuffer', () => {});
});

describe('StructArray', () => {

    it('should have the expected fields', () => {

        const def = new StructDefinition(new ScalarMember('a', 'uint32'));
        const buffer = new ArrayBuffer(4 * 20);
        const sa = new StructArray(buffer, def);

        expect(sa.buffer).toBe(buffer);
        expect(sa.length).toBe(20);
    });

    it('should set and get structs', () => {

        const def = new StructDefinition(new ScalarMember('a', 'uint32'));
        const buffer = new ArrayBuffer(4 * 20);
        const sa = new StructArray(buffer, def);

        for (let i = 0; i < sa.length; i++) {
            expect(sa[i]).toEqual({ a: 0 });
        }
        expect(sa[20]).toBe(undefined);

        const data = { a: 200 };
        sa[3] = data;
        expect(sa[3].a).toBe(200);

        data.a = 500;
        expect(sa[3].a).toBe(200);
        expect(sa[0].a).toBe(0);

    });

    it('should work by specifying a length', () => {

        const def = new StructDefinition(new ScalarMember('a', 'uint32'));
        const sa = new StructArray(100, def);
        expect(sa.length).toBe(100);

    });

    it(`should reuse an object if 'reuseObject' is true`, () => {

        const def = new StructDefinition(new ScalarMember('a', 'uint32'));
        const sa = new StructArray(100, def, { reuseObject: true });

        expect(sa[0]).toBe(sa[1]);

    });

    it(`should not reuse an object if 'reuseObject' is false`, () => {

        const def = new StructDefinition(new ScalarMember('a', 'uint32'));
        const sa = new StructArray(100, def, { reuseObject: false });

        expect(sa[0]).not.toBe(sa[1]);

    });

});

describe('Generated Functions', () => {

    it('should be able to read the array buffer', () => {

        const def = new StructDefinition(
            new FixedLengthArrayMember(
                'a',
                new StructDefinition(
                    new ScalarMember('b', 'uint32'),
                    new FixedLengthArrayMember('c', 'float64', 2),
                ),
                2
            ),
            new FixedLengthArrayMember(
                'b',
                'int32',
                2
            ),
            new ScalarMember('c', 'float64'),
        );

        const data = {
            a: [{
                b: 256,
                c: [1.1, 1.2],
            }, {
                b: 250,
                c: [1.2, 1.4],
            }],
            b: [ 1, 2 ],
            c: 100.1,
        };

        const cursor = { offset: 0 };
        const dataView = new DataView(new ArrayBuffer(20 * 2 + 8 + 8));

        setStruct(dataView, def, 0, data, cursor);

        const readFunc = createReadStructFunction(def);
        let readData = readFunc(dataView);
        expect(readData).toEqual(data);

        (new Uint8Array(dataView.buffer)).fill(0);
        const writeFunc = createWriteStructFunction(def);
        writeFunc(dataView, 0, data);

        readData = readFunc(dataView);
        expect(readData).toEqual(data);

    });

});
