import { expect } from 'chai';
import _ from 'lodash';
import validator from 'validator';

import generate from '../dist';

const userSchema = require('./user.json');

describe('Test', () => {
  it('should generate test data with differents variations based on required property', done => {
    const required = userSchema.required;
    const data = generate(userSchema);

    // should have data that has all required fields
    let found = _.some(data, d => {
      const v = d.valid;
      const keys = Object.keys(d.data);
      const diff = _.difference(required, keys);
      return v === true && diff.length === 0;
    });

    expect(found).to.be.equal(true);

    for (const req of required) {
      // check that there is sample data that does not have the required property
      found = _.some(data, d => {
        const v = d.valid;
        const keys = Object.keys(d.data);

        return v === false && keys.indexOf(req) === -1;
      });

      expect(found).to.be.equal(true);
    }

    done();
  });

  it('should generate test data with negative type tests for simple primitive data types', done => {
    const required = userSchema.required;
    const data = generate(userSchema);

    required.forEach(req => {
      const found = _.chain(data)
        .filter(d => d.valid === false && (d.property && d.property === req) && typeof d.data[req] !== 'undefined')
        .some(d => {
          const types = generate.getNegativeTypes(userSchema.properties[req]);
          const dataType = d.data[req] === null ? 'null' : typeof d.data[req];
          const check = types.indexOf(dataType) >= 0;
          return check;
        })
        .value();

      expect(found).to.be.equal(true);
    });

    done();
  });

  it('should create negative for number multipleOf', done => {
    const schema = {
      type: 'object',
      properties: {
        foo: {
          type: 'number',
          multipleOf: 2
        }
      },
      required: ['foo']
    };

    const data = generate(schema);
    const required = schema.required;

    required.forEach(req => {
      const found = _.chain(data)
        .filter(d => d.valid === false && (d.property && d.property === req) && typeof d.data[req] !== 'undefined')
        .some(d => {
          const val = d.data[req];
          return val % 2 !== 0;
        })
        .value();

      expect(found).to.be.equal(true);
    });

    done();
  });

  it('should create negative for number maximum', done => {
    const schema = {
      type: 'object',
      properties: {
        foo: {
          type: 'number',
          maximum: 3
        }
      }
    };

    const data = generate(schema);
    const found = _.chain(data)
      .filter(d => d.valid === false && typeof d.data.foo === 'number')
      .some(d => d.data.foo && d.data.foo > 3)
      .value();

    expect(found).to.be.equal(true);

    done();
  });

  it('should create negative for number minimum', done => {
    const schema = {
      type: 'object',
      properties: {
        foo: {
          type: 'number',
          minimum: 3
        }
      }
    };

    const data = generate(schema);
    const found = _.chain(data)
      .filter(d => d.valid === false && typeof d.data.foo === 'number')
      .some(d => d.data.foo && d.data.foo < 3)
      .value();

    expect(found).to.be.equal(true);

    done();
  });

  it('should create negative for string maxLength', done => {
    const schema = {
      type: 'object',
      properties: {
        foo: {
          type: 'string',
          maxLength: 5
        }
      }
    };

    const data = generate(schema);
    const found = _.chain(data)
      .filter(d => d.valid === false && typeof d.data.foo === 'string')
      .some(d => d.data.foo && d.data.foo.length > 5)
      .value();

    expect(found).to.be.equal(true);

    done();
  });

  it('should create negative for string minLength', done => {
    const schema = {
      type: 'object',
      properties: {
        foo: {
          type: 'string',
          minLength: 5
        }
      }
    };

    const data = generate(schema);
    const found = _.chain(data)
      .filter(d => d.valid === false && typeof d.data.foo === 'string')
      .some(d => d.data.foo && d.data.foo.length < 5)
      .value();

    expect(found).to.be.equal(true);

    done();
  });

  it('should create negative for string pattern date-time', done => {
    const schema = {
      type: 'object',
      properties: {
        foo: {
          type: 'string',
          format: 'date-time'
        }
      }
    };

    const data = generate(schema);
    const found = _.chain(data)
      .filter(d => d.valid === false && typeof d.data.foo === 'string')
      .some(d => d.data.foo && isNaN(Date.parse(d.data.foo)))
      .value();

    expect(found).to.be.equal(true);

    done();
  });

  it('should create negative for string pattern email', done => {
    const schema = {
      type: 'object',
      properties: {
        foo: {
          type: 'string',
          format: 'email'
        }
      }
    };

    const data = generate(schema);
    const found = _.chain(data)
      .filter(d => d.valid === false && typeof d.data.foo === 'string')
      .some(d => d.data.foo && !validator.isEmail(d.data.foo))
      .value();

    expect(found).to.be.equal(true);

    done();
  });

  it('should create negative for string pattern uri', done => {
    const schema = {
      type: 'object',
      properties: {
        foo: {
          type: 'string',
          format: 'uri'
        }
      }
    };

    const data = generate(schema);
    const found = _.chain(data)
      .filter(d => d.valid === false && typeof d.data.foo === 'string')
      .some(d => d.data.foo && !validator.isURL(d.data.foo))
      .value();

    expect(found).to.be.equal(true);

    done();
  });

  it('should create negative for array property maxItems', done => {
    const schema = {
      type: 'object',
      properties: {
        foo: {
          type: 'array',
          items: {
            type: 'string'
          },
          maxItems: 5
        }
      }
    };

    const data = generate(schema);
    const found = _.chain(data)
      .filter(d => d.valid === false && Array.isArray(d.data.foo))
      .some(d => d.data.foo && d.data.foo.length > 5)
      .value();

    expect(found).to.be.equal(true);

    done();
  });

  it('should create negative for array property minItems', done => {
    const schema = {
      type: 'object',
      properties: {
        foo: {
          type: 'array',
          items: {
            type: 'string'
          },
          minItems: 5
        }
      }
    };

    const data = generate(schema);
    const found = _.chain(data)
      .filter(d => d.valid === false && Array.isArray(d.data.foo))
      .some(d => d.data.foo && d.data.foo.length < 5)
      .value();

    expect(found).to.be.equal(true);

    done();
  });

  it('should create negative for array property uniqueItems', done => {
    const schema = {
      type: 'object',
      properties: {
        foo: {
          type: 'array',
          items: {
            type: 'string'
          },
          uniqueItems: true
        }
      }
    };

    const data = generate(schema);
    const found = _.chain(data)
      .filter(d => d.valid === false && Array.isArray(d.data.foo))
      .some(d => d.data.foo && _.uniq(d.data.foo).length < d.data.foo.length)
      .value();

    expect(found).to.be.equal(true);

    done();
  });

  it('should create negative simple type schema', done => {
    const schema = {
      type: 'string'
    };

    const data = generate(schema);

    const found = _.chain(data)
      .filter(d => d.valid === false)
      .some(d => typeof d.data !== 'string')
      .value();

    expect(found).to.be.equal(true);

    done();
  });

  it('should create negative simple type schema and additional properties', done => {
    const schema = {
      type: 'number',
      minimum: 5
    };

    const data = generate(schema);

    const found = _.chain(data)
      .filter(d => d.valid === false)
      .some(d => typeof d.data === 'number' && d.data < 5)
      .value();

    expect(found).to.be.equal(true);

    done();
  });

  it('should create negative test data for schema with array', done => {
    const schema = {
      type: 'object',
      properties: {
        name: {
          type: 'string'
        },
        foos: {
          type: 'array',
          items: {
            type: 'string',
            minLength: 5
          }
        }
      },
      required: ['name', 'foos']
    };

    const data = generate(schema);

    const found = _.chain(data)
      .filter(d => d.valid === false && d.data && Array.isArray(d.data.foos))
      .some(d => d.message.indexOf('within array test' >= 0))
      .value();

    expect(found).to.be.equal(true);

    done();
  });

  it('should create negative test data for schema with array and minItems property', done => {
    const schema = {
      type: 'object',
      properties: {
        name: {
          type: 'string'
        },
        foos: {
          type: 'array',
          items: {
            type: 'string',
            minLength: 5
          },
          minItems: 3
        }
      },
      required: ['name', 'foos']
    };

    const data = generate(schema);

    const found = _.chain(data)
      .filter(d => d.valid === false && d.data && Array.isArray(d.data.foos))
      .some(d => d.message.indexOf('within array test' >= 0) && d.data.foos.length < 3)
      .value();

    expect(found).to.be.equal(true);

    done();
  });

  it('should create negative test data for nested object property', done => {
    const schema = {
      type: 'object',
      properties: {
        name: {
          type: 'string'
        },
        foo: {
          type: 'object',
          properties: {
            bar: {
              type: 'string',
              minLength: 5
            }
          }
        }
      },
      required: ['name', 'foo']
    };

    const data = generate(schema);

    const found = _.chain(data)
      .filter(d => d.valid === false && d.data && d.data.foo && typeof d.data.foo.bar !== 'undefined')
      .filter(d => d.message.indexOf('nested object test' >= 0) && (typeof d.data.foo.bar !== 'string' || d.data.foo.bar.length < 5))
      .value();

    expect(found.length).to.be.equal(5);

    done();
  });
});
