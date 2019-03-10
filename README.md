# struct-data-view

<!-- [![npm version](https://img.shields.io/npm/v/js-struct-data-view.svg?style=flat-square)](https://www.npmjs.com/package/js-struct-data-view) -->
[![travis build](https://img.shields.io/travis/gkjohnson/js-struct-data-view.svg?style=flat-square)](https://travis-ci.org/gkjohnson/js-struct-data-view)
[![lgtm code quality](https://img.shields.io/lgtm/grade/javascript/g/gkjohnson/js-struct-data-view.svg?style=flat-square&label=code-quality)](https://lgtm.com/projects/g/gkjohnson/js-struct-data-view/)

Exploration of approaches for reading and writing object data to and from an ArrayBuffer. Useful for keeping object definitions in a compact form or sharing complex structures between web workers (performance benefits untested).

## Approach

### Defining a Struct

Structs are defined ahead of time using the `StructDefinition` and the `StructMember` classes.

```js
import { StructDefinition, ScalarMember, FixedLengthArrayMember } from 'struct-data-view';

// struct Vector3 {
//   float32 x;
//   float32 y;
//   float32 z;
// }
// 12 bytes
const Vector3 = new StructDefinition(
    new ScalarMember('x', 'float32'),
    new ScalarMember('y', 'float32'),
    new ScalarMember('z', 'float32'),
);

// struct Line {
//   uint32 color;
//   Vector3 points[2];
//   float32 thickness[2];
// }
// 36 bytes
const Line = new StructDefinition(
    new ScalarMember('color', 'uint32'),
    new FixedLengthArrayMember('points', Vector3, 2),
    new FixedLengthArrayMember('thickness', 'float32', 2)
);

```

Only fixed array lengths and the typed array types are implemented.

### Reading a Struct

Once a struct is created it can be read from or written to an ArrayBuffer with a few different methods.

#### DataView Helpers

The slowest of the available methods. Based on the provided struct definition these functions read the values from the provided `DataView` and write them into the target object (or writing them from the target object into the buffer if setting the struct). This approach recursively traverses the struct definition and uses the appropriate DataView `set` / `get` function to write / read the data.

```js
import { getStruct, setStruct } from 'struct-data-view';

// ... struct definition...

const buffer = new ArrayBuffer(36);
const dataView = new DataView(buffer);

const data = {
    color: 0xff0000,
    points: [
        { x: -1, y: -1, z: -1 },
        { x:  1, y:  1, z:  1 }
    ],
    thickness: [1, 2]
};
setStruct(dataView, Line, 0, data);

const target = {};
getStruct(dataView, Line, 0, target);

```

#### Generated Read / Write Functions

The fastest of the available methods. Based on the provided struct definition a function is written with the appropriate read / write functions inlined to save time. If a single array buffer is provided to read / write from then a fast path with Typed Arrays can be taken.

The fast path can only be taken if the read can by done with a Typed Array which cannot happen if the byte offset is not byte aligned with the byte length for the given array type.

```js
import {
    createReadStructFunction, createReadStructFromArrayBufferFunction,
    createWriteStructFunction, createWriteStructFromArrayBufferFunction
} from 'struct-data-view';

// ... struct definition...
// ... data definition...

const buffer = new ArrayBuffer(36);
const dataView = new DataView(buffer);

const target = {};

// slower but can be used generally
const writeLineFunc = createWriteStructFunction(Line);
const readLineFunc = createReadStructFunction(Line);
writeLineFunc(dataView, 0, data);
readLineFunc(dataView, 0, target);

// faster but can only be used with one array buffer
const fastWriteLineFunc = createWriteStructFromArrayBufferFunction(Line, buffer);
const fastReadLineFunc = createReadStructFromArrayBufferFunction(Line, buffer);
fastWriteLineFunc(0, data);
fastReadLineFunc(0, target);

```

#### Struct Array Wrapper

A convenience method for reading and writing data to and from an array buffer. Behavior is similar to a Typed Array.

```js
import { StructArray } from 'struct-data-view';

// ... struct definition...
// ... data definition...

const buffer = new ArrayBuffer(36);
const structArray = new StructArray(buffer, Line);

structArray[0] = data;
console.log(structArray[0]);

```

## TODO / Considerations

- Add constructor support to the struct definitions so a class can be instantiated instead of a basic object.
- Add support for variable length arrays
- Add support for strings
- Add support for seeking through an array
- Add example for reading and writing data of varying types of structs
- Add read and write functions to `StructArray` to avoid proxy overhead
- Add method for reading _only_ the needed values so the overhead of reading all values is not incurred if only a single field is being used.
- Add pointer support so an offset into the current buffer can be declared.
