import { ArrayMember } from './classes.js';
import { BYTE_LENGTHS, TYPED_ARRAY_TYPES, READ_FUNCTIONS, WRITE_FUNCTIONS } from './constants.js';

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

export {
    createReadStructFunction, createReadStructFromArrayBufferFunction,
    createWriteStructFunction, createWriteStructFromArrayBufferFunction,
};
