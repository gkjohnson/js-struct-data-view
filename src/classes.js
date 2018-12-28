
class StructDefinition extends Array {

}

class ScalarMember {

    constructor(name, type, littleEndian = false) {

        this.name = name;
        this.type = type.toLowerCase();
        this.littleEndian = littleEndian;

    }

}

class ArrayMember {

    constructor(name, type, length = 0, littleEndian = false) {

        this.name = name;
        this.type = type.toLowerCase();
        this.length = length;
        this.littleEndian = littleEndian;

    }

    getLength(dataView, readCursor) {

        return this.length;

    }

    writeLength(dataView, readCursor, value) {

        return this.length;

    }

}

export { StructDefinition, ScalarMember, ArrayMember };
