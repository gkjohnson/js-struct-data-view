import { nextStruct, getStruct, setStruct } from './structFunctions.js';

export class StructArray extends Proxy {

    constructor(buffer, structDefinition) {

        const size = nextStruct(null, structDefinition);
        const dataView = new DataView(buffer);

        super(buffer, {

            get(target, key) {

                key = isNaN(key) ? key : parseFloat(key);

                if (key === 'length') {

                    return target.byteLength / size;

                } else if (Number.isInteger(key)) {

                    const offset = key * size;
                    if (key >= 0 && offset + size <= target.byteLength) {

                        return getStruct(dataView, structDefinition, offset);

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

                } else {

                    return key in target;

                }

            },

        });

    }

}
