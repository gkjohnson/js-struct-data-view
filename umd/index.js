(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = global || self, factory(global.JsStruct = {}));
}(this, function (exports) { 'use strict';

    class StructDefinition extends Array {

    }

    class StructMember { }

    class ScalarMember extends StructMember {

        constructor(name, type, littleEndian = false) {

            super();

            this.name = name;
            this.type = typeof type === 'string' ? type.toLowerCase() : type;
            this.littleEndian = littleEndian;

        }

    }

    class ArrayMember extends StructMember {

        constructor(name, type, littleEndian = false) {

            super();

            this.name = name;
            this.type = typeof type === 'string' ? type.toLowerCase() : type;
            this.littleEndian = littleEndian;

        }

        getLength(dataView, readCursor) {

            return 0;

        }

        writeLength(dataView, readCursor, value) {

            return 0;

        }

    }

    class FixedLengthArrayMember extends ArrayMember {

        constructor(name, type, length = 0, littleEndian = false) {

            super(name, type, littleEndian);
            this.length = length;

        }

        getLength(dataView, readCursor) {

            return this.length;

        }

        writeLength(dataView, readCursor, value) {

            return this.length;

        }

    }

    const BYTE_LENGTHS = {
        'uint8': 1,
        'uint16': 2,
        'uint32': 4,
        'uint64': 8,

        'int8': 1,
        'int16': 2,
        'int32': 4,
        'int64': 8,

        'float32': 4,
        'float64': 8,
    };

    const READ_FUNCTIONS = {
        'uint8': 'getUint8',
        'uint16': 'getUint16',
        'uint32': 'getUint32',
        'uint64': 'getBigUint64',

        'int8': 'getInt8',
        'int16': 'getInt16',
        'int32': 'getInt32',
        'int64': 'getBigInt64',

        'float32': 'getFloat32',
        'float64': 'getFloat64',
    };

    const WRITE_FUNCTIONS = {
        'uint8': 'setUint8',
        'uint16': 'setUint16',
        'uint32': 'setUint32',
        'uint64': 'setBigUint64',

        'int8': 'setInt8',
        'int16': 'setInt16',
        'int32': 'setInt32',
        'int64': 'setBigInt64',

        'float32': 'setFloat32',
        'float64': 'setFloat64',
    };

    // The cursor to use to keep track of where the current offset is
    // for writing or reading next bytes
    const defaultCursor = { offset: 0 };

    // Forms a struct from the data in the buffer based on the struct definition
    function getStruct(dataView, definition, offset = 0, target = {}, cursor = defaultCursor) {

        cursor.offset = offset;
        for (let i = 0, l = definition.length; i < l; i++) {

            const member = definition[ i ];
            const { name, type, littleEndian } = member;

            // nested structs
            if (Array.isArray(type)) {

                // If it's an array type
                if (member instanceof ArrayMember) {

                    const length = member.getLength(dataView, cursor);

                    if (!Array.isArray(target[name])) target[name] = [];
                    const arr = target[name] || [];
                    arr.length = length;

                    for (let j = 0; j < length; j++) {

                        arr[j] = arr[j] || {};
                        getStruct(dataView, type, cursor.offset, arr[j], cursor);

                    }
                    target[name] = arr;

                } else {

                    target[name] = target[name] || {};
                    getStruct(dataView, type, cursor.offset, target[name], cursor);

                }

            } else {

                const byteLength = BYTE_LENGTHS[type];
                const readFunc = READ_FUNCTIONS[type];

                if (member instanceof ArrayMember) {

                    const length = member.getLength(dataView, cursor);

                    if (!Array.isArray(target[name])) target[name] = [];
                    const arr = target[name];
                    arr.length = length;

                    for (let j = 0; j < length; j++) {

                        arr[j] = dataView[readFunc](cursor.offset, littleEndian);
                        cursor.offset += byteLength;

                    }

                } else {

                    target[name] = dataView[readFunc](cursor.offset, littleEndian);
                    cursor.offset += byteLength;

                }

            }

        }

        return target;

    }

    // Writes a struct into the buffer based on the struct definition and value
    function setStruct(dataView, definition, offset, value, cursor = defaultCursor) {

        cursor.offset = offset;
        for (let i = 0, l = definition.length; i < l; i++) {

            const member = definition[i];
            const { name, type, littleEndian } = member;
            const memberVal = value[name];

            // nested structs
            if (Array.isArray(type)) {

                if (member instanceof ArrayMember) {

                    const length = member.writeLength(dataView, cursor, memberVal);
                    for (let j = 0; j < length; j++) {

                        setStruct(dataView, type, cursor.offset, memberVal[j], cursor);

                    }

                } else {

                    setStruct(dataView, type, cursor.offset, memberVal, cursor);

                }

            } else {

                const byteLength = BYTE_LENGTHS[type];
                const writeFunc = WRITE_FUNCTIONS[type];

                if (member instanceof ArrayMember) {

                    const length = member.writeLength(dataView, cursor, memberVal);
                    for (let j = 0; j < length; j++) {

                        dataView[writeFunc](cursor.offset, memberVal[j] || 0, littleEndian);
                        cursor.offset += byteLength;

                    }

                } else {

                    dataView[writeFunc](cursor.offset, memberVal, littleEndian);
                    cursor.offset += byteLength;

                }

            }

        }

    }

    // Finds the offset of the next struct
    function nextStruct(dataView, definition, offset = 0) {

        const cursor = defaultCursor;
        cursor.offset = offset;
        for (let i = 0, l = definition.length; i < l; i++) {

            const member = definition[ i ];
            const type = member.type;

            if (Array.isArray(type)) {

                if (member instanceof ArrayMember) {
                    const length = member.getLength(dataView, cursor);

                    for (let j = 0; j < length; j++) {

                        nextStruct(dataView, type, cursor.offset);

                    }

                } else {

                    nextStruct(dataView, type, cursor.offset);

                }

            } else {

                const byteLength = BYTE_LENGTHS[type];
                if (member instanceof ArrayMember) {

                    const length = member.getLength(dataView, cursor);
                    cursor.offset += byteLength * length;

                } else {

                    cursor.offset += byteLength;

                }

            }

        }

        return cursor.offset;

    }

    exports.getStruct = getStruct;
    exports.setStruct = setStruct;
    exports.nextStruct = nextStruct;
    exports.StructDefinition = StructDefinition;
    exports.StructMember = StructMember;
    exports.ScalarMember = ScalarMember;
    exports.ArrayMember = ArrayMember;
    exports.FixedLengthArrayMember = FixedLengthArrayMember;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
