import { getStruct, setStruct } from './structFunctions.js';

function dataViewGetStruct(...args) {

    getStruct(this, ...args);

}

function dataViewSetStruct(...args) {

    setStruct(this, ...args);

}

export { dataViewGetStruct as getStruct, dataViewSetStruct as setStruct };
