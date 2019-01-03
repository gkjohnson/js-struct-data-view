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

    const TYPED_ARRAY_TYPES = {

        'uint8': 'Uint8Array',
        'uint16': 'Uint16Array',
        'uint32': 'Uint32Array',
        'uint64': 'BigUint64Array',

        'int8': 'Int8Array',
        'int16': 'Int16Array',
        'int32': 'Int32Array',
        'int64': 'BigInt64Array',

        'float32': 'Float32Array',
        'float64': 'Float64Array',

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

    let varId = 0;
    function createReadStructString(definition, options) {

        options = Object.assign({

            keyPrefix: '',
            targetId: '',
            useTypedArrays: false,

        }, options);

        let str = '';
        for (let i = 0, l = definition.length; i < l; i++) {

            const member = definition[i];
            const { name, type, littleEndian } = member;
            const keyName = `${ options.keyPrefix }_${ name }`;

            const thisId = varId;
            const iteratorId = `i${ thisId }`;
            const newTargetId = `t${ thisId }`;
            const lengthId = `l${ thisId }`;
            const arrId = `a${ thisId }`;
            varId++;

            // nested structs
            if (Array.isArray(type)) {

                if (member instanceof ArrayMember) {

                    str +=
                    `

                    // Read Array of Structs
                    const ${ lengthId } = ${ keyName }.getLength(dataView, cursor);
                    let ${ arrId } = ${ options.targetId }['${ name }'];
                    if (!Array.isArray(${ arrId })) ${ arrId } = ${ options.targetId }['${ name }'] = new Array(${ lengthId });
                    if (${ arrId }.length !== ${ lengthId }) ${ arrId }.length = ${ lengthId };

                    for(let ${ iteratorId } = 0; ${ iteratorId } < ${ lengthId }; ${ iteratorId } ++) {

                        const ${ newTargetId } = ${ arrId }[${ iteratorId }] = ${ arrId }[${ iteratorId }] || {};
                        ${ createReadStructString(type, { keyPrefix: keyName, targetId: newTargetId }) }

                    }

                `;

                } else {

                    str +=
                    `

                    // Read Scalar Struct
                    const ${ newTargetId } = ${ options.targetId }['${ name }'] = ${ options.targetId }['${ name }'] || {};
                    ${ createReadStructString(type, { keyPrefix: keyName, targetId: newTargetId }) }

                `;

                }

            } else {

                let readLine = `dataView.${ READ_FUNCTIONS[type] }(cursor.offset, ${ littleEndian })`;
                if (options.useTypedArrays) {

                    const typedArray = `${ type }array`;
                    const condition = `(${ typedArray }.byteLength % ${ BYTE_LENGTHS[type] }) === 0 && (cursor.offset % ${ BYTE_LENGTHS[type] } === 0)`;
                    readLine = `${ condition } ? ${ typedArray }[cursor.offset / ${ BYTE_LENGTHS[type] }] : ${ readLine }`;

                }

                if (member instanceof ArrayMember) {

                    str +=
                    `

                    // Read Array of Values
                    const ${ lengthId } = ${ keyName }.getLength(dataView, cursor);
                    let ${ arrId } = ${ options.targetId }['${ name }'];
                    if (!Array.isArray(${ arrId })) ${ arrId } = ${ options.targetId }['${ name }'] = new Array(${ lengthId });
                    if (${ arrId }.length !== ${ lengthId }) ${ arrId }.length = ${ lengthId };
                    for(let ${ iteratorId } = 0; ${ iteratorId } < ${ lengthId }; ${ iteratorId } ++) {

                        ${ arrId }[${ iteratorId }] = ${ readLine };
                        cursor.offset += ${ BYTE_LENGTHS[type] };

                    }

                `;

                } else {

                    str +=
                    `

                    // Read Value
                    ${ options.targetId }['${ name }'] = ${ readLine };
                    cursor.offset += ${ BYTE_LENGTHS[type] };

                `;

                }

            }

        }

        return str;

    }

    function createWriteStructString(definition, options) {

        options = Object.assign({

            keyPrefix: '',
            targetId: '',
            useTypedArrays: false,

        }, options);

        let str = '';
        for (let i = 0, l = definition.length; i < l; i++) {

            const member = definition[i];
            const { name, type, littleEndian } = member;
            const keyName = `${ options.keyPrefix }_${ name }`;

            const thisId = varId;
            const iteratorId = `i${ thisId }`;
            const newTargetId = `t${ thisId }`;
            const lengthId = `l${ thisId }`;
            const arrId = `a${ thisId }`;
            const valId = `v${ thisId }`;
            varId++;

            // nested structs
            if (Array.isArray(type)) {

                if (member instanceof ArrayMember) {

                    str +=
                    `

                    // Read Array of Structs
                    const ${ arrId } = ${ options.targetId }['${ name }'];
                    const ${ lengthId } = ${ keyName }.writeLength(dataView, cursor, ${ arrId });
                    for(let ${ iteratorId } = 0; ${ iteratorId } < ${ lengthId }; ${ iteratorId } ++) {

                        const ${ newTargetId } = ${ arrId }[${ iteratorId }];
                        ${ createWriteStructString(type, { keyPrefix: keyName, targetId: newTargetId }) }

                    }

                `;

                } else {

                    str +=
                    `

                    // Read Scalar Struct
                    const ${ newTargetId } = ${ options.targetId }['${ name }'];
                    ${ createWriteStructString(type, { keyPrefix: keyName, targetId: newTargetId }) }

                `;

                }

            } else {

                let writeLine = `dataView.${ WRITE_FUNCTIONS[type] }(cursor.offset, ${ valId }, ${ littleEndian })`;
                if (options.useTypedArrays) {

                    const typedArray = `${ type }array`;
                    const condition = `(${ typedArray }.byteLength % ${ BYTE_LENGTHS[type] }) === 0 && (cursor.offset % ${ BYTE_LENGTHS[type] } === 0)`;
                    writeLine =
                    `
                    if(${ condition }) ${ typedArray }[cursor.offset / ${ BYTE_LENGTHS[type] }] = ${ valId };
                    else ${ writeLine };
                `;

                }

                if (member instanceof ArrayMember) {

                    str +=
                    `

                    // Read Array of Values
                    const ${ arrId } = ${ options.targetId }['${ name }'];
                    const ${ lengthId } = ${ keyName }.writeLength(dataView, cursor, ${ arrId });

                    for(let ${ iteratorId } = 0; ${ iteratorId } < ${ lengthId }; ${ iteratorId } ++) {

                        const ${ valId } = ${ arrId }[${ iteratorId }];
                        ${ writeLine };
                        cursor.offset += ${ BYTE_LENGTHS[type] };

                    }

                `;

                } else {

                    str +=
                    `

                    // Write Value
                    const ${ valId } = ${ options.targetId }['${ name }'];
                    ${ writeLine }
                    cursor.offset += ${ BYTE_LENGTHS[type] };

                `;

                }

            }

        }

        return str;

    }

    function breakOutDefinitions(definition, currVar, prefix = '') {

        let str = '';
        for (let i = 0, l = definition.length; i < l; i++) {

            const member = definition[i];
            const { name, type } = member;
            str +=
            `
            const ${ prefix }_${ name } = ${ currVar }[${ i }];
        `;

            if (Array.isArray(type)) {

                str += breakOutDefinitions(type, `${ prefix }_${ name }.type`, `${ prefix }_${ name }`);

            }

        }

        return str;

    }

    const cursor = { offset: 0 };
    function createReadStructFunction(definition) {

        const str =
        `
        ${ breakOutDefinitions(definition, 'definition') }

        return function(dataView, offset = 0, target = {}, cursor = defaultCursor) {
            cursor.offset = offset;
            ${ createReadStructString(definition, { targetId: 'target' }) }
            return target;
        }
    `;

        return (new Function('definition', 'defaultCursor', str))(definition, cursor); // eslint-disable-line no-new-func

    }

    function createWriteStructFunction(definition) {

        const str =
        `
        ${ breakOutDefinitions(definition, 'definition') }

        return function(dataView, offset = 0, target = {}, cursor = defaultCursor) {
            cursor.offset = offset;
            ${ createWriteStructString(definition, { targetId: 'target' }) }
            return target;
        }
    `;

        return (new Function('definition', 'defaultCursor', str))(definition, cursor); // eslint-disable-line no-new-func

    }

    function createReadStructFromArrayBufferFunction(definition, arrayBuffer) {

        const typedArrayDefinitions =
            Object.entries(TYPED_ARRAY_TYPES)
                .map(([key, value]) => `const ${ key }array = new ${ value }(arrayBuffer);`)
                .join('\n');

        const str =
        `
        ${ breakOutDefinitions(definition, 'definition') }

        const dataView = new DataView(arrayBuffer);

        ${ typedArrayDefinitions }

        return function(offset = 0, target = {}, cursor = defaultCursor) {
            cursor.offset = offset;
            ${ createReadStructString(definition, { targetId: 'target', useTypedArrays: true }) }
            return target;
        }
    `;

        return (new Function('definition', 'arrayBuffer', 'defaultCursor', str))(definition, arrayBuffer, cursor); // eslint-disable-line no-new-func

    }

    function createWriteStructFromArrayBufferFunction(definition, arrayBuffer) {

        const typedArrayDefinitions =
            Object.entries(TYPED_ARRAY_TYPES)
                .map(([key, value]) => `const ${ key }array = new ${ value }(arrayBuffer);`)
                .join('\n');

        const str =
        `
        ${ breakOutDefinitions(definition, 'definition') }

        const dataView = new DataView(arrayBuffer);

        ${ typedArrayDefinitions }

        return function(offset = 0, target = {}, cursor = defaultCursor) {
            cursor.offset = offset;
            ${ createWriteStructString(definition, { targetId: 'target', useTypedArrays: true }) }
            return target;
        }
    `;

        return (new Function('definition', 'arrayBuffer', 'defaultCursor', str))(definition, arrayBuffer, cursor); // eslint-disable-line no-new-func

    }

    class ExtendableProxyClass {

        constructor(buffer, structDefinition, options = null) {

            options = Object.assign({
                reuseObject: false,
            }, options);

            const size = nextStruct(null, structDefinition);
            if (!isNaN(buffer)) buffer = new ArrayBuffer(buffer * size);

            const dataView = new DataView(buffer);
            const targetObject = options.reuseObject ? {} : undefined;

            return new Proxy(buffer, {

                get(target, key) {

                    key = isNaN(key) ? key : parseFloat(key);

                    if (key === 'length') {

                        return target.byteLength / size;

                    } else if (key === 'buffer') {

                        return buffer;

                    } else if (Number.isInteger(key)) {

                        const offset = key * size;
                        if (key >= 0 && offset + size <= target.byteLength) {

                            return getStruct(dataView, structDefinition, offset, targetObject);

                        } else {

                            return undefined;

                        }

                    } else {

                        return target[key];

                    }

                },

                set(target, key, value) {

                    key = isNaN(key) ? key : parseFloat(key);

                    if (Number.isInteger(key)) {

                        const offset = key * size;
                        if (key >= 0 && offset + size <= target.byteLength) {

                            setStruct(dataView, structDefinition, offset, value);

                        }

                    } else {

                        target[key] = value;

                    }

                },

                has(target, key) {

                    key = isNaN(key) ? key : parseFloat(key);

                    if (Number.isInteger(key)) {

                        return key < this.length && key >= 0;

                    } else if (key === 'length' || key === 'buffer') {

                        return true;

                    } else {

                        return key in target;

                    }

                },

            });

        }

    }

    class StructArray extends ExtendableProxyClass {}

    exports.getStruct = getStruct;
    exports.setStruct = setStruct;
    exports.nextStruct = nextStruct;
    exports.StructArray = StructArray;
    exports.StructDefinition = StructDefinition;
    exports.StructMember = StructMember;
    exports.ScalarMember = ScalarMember;
    exports.ArrayMember = ArrayMember;
    exports.FixedLengthArrayMember = FixedLengthArrayMember;
    exports.createReadStructFunction = createReadStructFunction;
    exports.createReadStructFromArrayBufferFunction = createReadStructFromArrayBufferFunction;
    exports.createWriteStructFunction = createWriteStructFunction;
    exports.createWriteStructFromArrayBufferFunction = createWriteStructFromArrayBufferFunction;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
