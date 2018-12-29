import { nextStruct, getStruct, setStruct } from './structFunctions.js';

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

export default class StructArray extends ExtendableProxyClass {};
