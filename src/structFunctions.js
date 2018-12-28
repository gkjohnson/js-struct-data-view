import { StructDefinition, ArrayMember } from './classes.js';
import { BYTE_LENGTHS, READ_FUNCTIONS, WRITE_FUNCTIONS } from './constants.js';

const defaultCursor = { offset: 0 };
function getStruct(dataView, definition, offset = 0, target = {}, cursor = defaultCursor) {

    cursor.offset = offset;
    for (let i = 0, l = definition.length; i < l; i++) {

        const member = definition[ i ];
        const { name, type, littleEndian } = member;

        if (type instanceof StructDefinition) {

            if (member instanceof ArrayMember) {

                const length = member.getLength(dataView, cursor);
                const arr = target[name] || [];
                for (let j = 0; j < length; j++) {

                    if (arr.length <= j) arr[j].push({});
                    getStruct(dataView, type, cursor.offset, arr[j]);

                }
                target[name] = arr;

            } else {

                target[name] = target[name] || {};
                getStruct(dataView, type, cursor.offset, target[name]);

            }

        } else {

            const byteLength = BYTE_LENGTHS[type];
            const readFunc = READ_FUNCTIONS[type];

            if (member instanceof ArrayMember) {

                const length = member.getLength(dataView, cursor);
                const arr = target[name] || new Array(length);
                if (arr.length !== length) arr.length = length;
                for (let j = 0; j < length; j++) {

                    target[name] = dataView[readFunc](cursor.offset, littleEndian);
                    cursor.offset += byteLength;

                }

            } else {

                target[name] = dataView[readFunc](cursor.offset, littleEndian);
                cursor.offset += byteLength;

            }

        }

    }

}

function setStruct(dataView, definition, offset, value, cursor = defaultCursor) {

    cursor.offset = offset;
    for (let i = 0, l = definition.length; i < l; i++) {

        const member = definition[i];
        const { name, type, littleEndian } = member;
        const memberVal = value[name];

        if (type instanceof StructDefinition) {

            if (length > 1) {

                const length = member.writeLength(dataView, cursor, memberVal);
                for (let j = 0; j < length; j++) {

                    setStruct(dataView, type, cursor.offset, memberVal[i]);

                }

            } else {

                setStruct(dataView, type, cursor.offset, memberVal);

            }

        } else {

            const byteLength = BYTE_LENGTHS[type];
            const writeFunc = WRITE_FUNCTIONS[type];

            if (length > 1) {

                const length = member.writeLength(dataView, cursor, memberVal);
                for (let j = 0; j < length; j++) {

                    dataView[writeFunc](cursor.offset, memberVal[i] || 0, littleEndian);
                    cursor.offset += byteLength;

                }

            } else {

                dataView[writeFunc](cursor.offset, memberVal, littleEndian);
                cursor.offset += byteLength;

            }

        }

    }

}

function nextStruct(dataView, definition, offset = 0) {

    const cursor = defaultCursor;
    cursor.offset = offset;
    for (let i = 0, l = definition.length; i < l; i++) {

        const member = definition[ i ];
        const type = member.type;
        const length = member.getLength(dataView, cursor);

        if (type instanceof StructDefinition) {

            if (length > 1) {

                for (let j = 0; j < length; j++) {

                    nextStruct(dataView, type, cursor.offset);

                }

            } else {

                nextStruct(dataView, type, cursor.offset);

            }

        } else {

            const byteLength = BYTE_LENGTHS[type];
            cursor.offset += byteLength * length;

        }

    }

    return cursor.offset;

}

export { getStruct, setStruct, nextStruct };
