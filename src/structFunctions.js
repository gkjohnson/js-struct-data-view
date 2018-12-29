import { ArrayMember } from './classes.js';
import { BYTE_LENGTHS, READ_FUNCTIONS, WRITE_FUNCTIONS } from './constants.js';

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

export { getStruct, setStruct, nextStruct };
