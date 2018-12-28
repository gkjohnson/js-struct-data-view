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

export { BYTE_LENGTHS, READ_FUNCTIONS, WRITE_FUNCTIONS };
