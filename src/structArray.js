import { nextStruct } from './structFunctions.js';
import {
    createReadStructFromArrayBufferFunction, createWriteStructFromArrayBufferFunction,
} from './generatedFunctions.js';

class ExtendableProxyClass {

    constructor(buffer, structDefinition, options = null) {

        options = Object.assign({
            reuseObject: false,
        }, options);

        const size = nextStruct(null, structDefinition);
        if (!isNaN(buffer)) buffer = new ArrayBuffer(buffer * size);

        const targetObject = options.reuseObject ? {} : undefined;
        const readFunc = createReadStructFromArrayBufferFunction(structDefinition, buffer);
        const writeFunc = createWriteStructFromArrayBufferFunction(structDefinition, buffer);

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

                        return readFunc(offset, targetObject);

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

                        writeFunc(offset, value);

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

export default class StructArray extends ExtendableProxyClass {};
