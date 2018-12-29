
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

export { StructDefinition, StructMember, ScalarMember, ArrayMember, FixedLengthArrayMember };
