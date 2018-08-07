import { expect } from 'chai';
import Chance from 'chance';
import jsf from 'json-schema-faker';
import _ from 'lodash';

import {
  SHOULD_WORK_REQUIRED,
  SHOULD_WORK_TYPE,
  SHOULD_WORK_TYPE_ARRAY_MAX_ITEMS,
  SHOULD_WORK_TYPE_ARRAY_MIN_ITEMS,
  SHOULD_WORK_TYPE_ARRAY_UNIQUE_ITEMS,
  SHOULD_WORK_TYPE_NUMBER_MAXIMUM,
  SHOULD_WORK_TYPE_NUMBER_MINIMUM,
  SHOULD_WORK_TYPE_STRING_ENUM,
  SHOULD_WORK_TYPE_STRING_FORMAT,
  SHOULD_WORK_TYPE_STRING_MAX_LENGTH,
  SHOULD_WORK_TYPE_STRING_MIN_LENGTH,
  TYPES,
} from './constants';
import ps from './prop-search';

const chance = new Chance();

function validate(schema) {
  if (typeof schema !== 'object') {
    return false;
  }

  if (typeof schema.properties !== 'object' && typeof schema.type !== 'string') {
    return false;
  }

  return true;
}

function getNegativeTypes(prop) {
  if (!prop || !prop.type || (typeof prop.type !== 'string' && !Array.isArray(prop.type))) {
    return;
  }

  const allowedTypes = typeof prop.type === 'string' ? [prop.type] : prop.type;
  if (!allowedTypes.length) {
    return;
  }

  return _.difference(TYPES, allowedTypes, ['object', 'array']);
}

function generateForProp(schema, type, key, originalProp) {
  let d = jsf(schema);
  let value;
  if (type === 'string') {
    value = chance.string();
  } else if (type === 'number') {
    value = chance.floating({ min: 0, max: 100, fixed: 2 });
  } else if (type === 'integer') {
    value = chance.integer();
  } else if (type === 'boolean') {
    value = chance.bool();
  } else if (type === 'null') {
    value = null;
  }

  if (key) {
    d[key] = value;
  } else {
    d = value;
  }

  let shouldWork;
  if (type !== 'number' && originalProp.type === 'integer') {
    shouldWork = SHOULD_WORK_TYPE['number'];
  } else {
    shouldWork = SHOULD_WORK_TYPE[originalProp.type];
  }

  let ret;
  if (type === 'null' && originalProp.nullable) {
    ret = {
      valid: true,
      data: d,
      message: key ? `should work with '${key}' of type '${type}'` : `should work with type '${type}'`,
      expect: expectSuccessFunction
    };
  } else {
    ret = {
      valid: false,
      data: d,
      message: key ? `should not work with '${key}' of type '${type}'` : `should not work with type '${type}'`,
      expect: expectErrorFunction(shouldWork, key),
      shouldWork
    };
  }

  if (key) {
    ret.property = key;
  }

  return ret;
}

function generateNegativeType(schema, prop, key) {
  let res = [];

  const negativesTypes = getNegativeTypes(prop);
  if (!negativesTypes || !negativesTypes.length) {
    return res;
  }

  negativesTypes.forEach(negativeType => {
    res.push(generateForProp(schema, negativeType, key, prop));
  });

  return res;
}

function generateNegativesForNumber(schema, prop, key) {
  const ret = [];
  if (typeof prop.multipleOf === 'number' && prop.multipleOf >= 0) {
    let d = jsf(schema);
    const nv = prop.multipleOf - 1;
    if (key) {
      d[key] = nv;
    } else {
      d = nv;
    }

    const r = {
      valid: false,
      data: d,
      message: key ? `should not pass validation for multipleOf property: ${key}` : 'should not pass validation for multipleOf'
    };

    if (key) {
      r.property = key;
    }

    ret.push(r);
  }
  if (typeof prop.maximum === 'number') {
    let d = jsf(schema);
    const nv = prop.maximum + 1;
    if (key) {
      d[key] = nv;
    } else {
      d = nv;
    }

    const r = {
      valid: false,
      data: d,
      message: key ? `should not pass validation for maximum of property: ${key}` : 'should not pass validation for maximum',
      expect: expectErrorFunction(SHOULD_WORK_TYPE_NUMBER_MAXIMUM, key),
      shouldWork: SHOULD_WORK_TYPE_NUMBER_MAXIMUM
    };

    if (key) {
      r.property = key;
    }

    ret.push(r);
  }
  if (typeof prop.minimum === 'number') {
    let d = jsf(schema);
    const nv = prop.minimum - 1;
    if (key) {
      d[key] = nv;
    } else {
      d = nv;
    }

    const r = {
      valid: false,
      data: d,
      message: key ? `should not pass validation for minimum of property: ${key}` : 'should not pass validation for minimum',
      expect: expectErrorFunction(SHOULD_WORK_TYPE_NUMBER_MINIMUM, key),
      shouldWork: SHOULD_WORK_TYPE_NUMBER_MINIMUM
    };

    if (key) {
      r.property = key;
    }

    ret.push(r);
  }

  return ret;
}

function generateNegativesForString(schema, prop, key) {
  const ret = [];
  if (typeof prop.maxLength === 'number') {
    let d = jsf(schema);
    const nv = chance.string({ length: prop.maxLength + 1 });

    if (key) {
      d[key] = nv;
    } else {
      d = nv;
    }

    const r = {
      valid: false,
      data: d,
      message: key ? `should not pass validation for maxLength of property: ${key}` : 'should not pass validation for maxLength',
      expect: expectErrorFunction(SHOULD_WORK_TYPE_STRING_MAX_LENGTH, key),
      shouldWork: SHOULD_WORK_TYPE_STRING_MAX_LENGTH
    };

    if (key) {
      r.property = key;
    }

    ret.push(r);
  }
  if (typeof prop.minLength === 'number' && prop.minLength > 0) {
    let d = jsf(schema);
    const nv = chance.string({ length: prop.minLength - 1 });

    if (key) {
      d[key] = nv;
    } else {
      d = nv;
    }

    const r = {
      valid: false,
      data: d,
      message: key ? `should not pass validation for minLength of property: ${key}` : 'should not pass validation for minLength',
      expect: expectErrorFunction(SHOULD_WORK_TYPE_STRING_MIN_LENGTH, key),
      shouldWork: SHOULD_WORK_TYPE_STRING_MIN_LENGTH
    };

    if (key) {
      r.property = key;
    }

    ret.push(r);
  }
  if (typeof prop.format === 'string') {
    let d = jsf(schema);
    const nv = chance.string();
    if (key) {
      d[key] = nv;
    } else {
      d = nv;
    }

    const r = {
      valid: false,
      data: d,
      message: key ? `should not pass validation for format of property: ${key}` : 'should not pass validation for format',
      expect: expectErrorFunction(SHOULD_WORK_TYPE_STRING_FORMAT, key),
      shouldWork: SHOULD_WORK_TYPE_STRING_FORMAT
    };

    if (key) {
      r.property = key;
    }

    ret.push(r);
  }
  if (typeof prop.enum === 'object' && prop.enum.length > 0) {
    let d = jsf(schema);
    let nv = chance.string();

    while (prop.enum.includes(nv)) {
      nv = chance.string();
    }

    if (key) {
      d[key] = nv;
    } else {
      d = nv;
    }

    const r = {
      valid: false,
      data: d,
      message: key ? `should not pass validation for accepted values of property: ${key}` : 'should not pass validation for accepted values',
      expect: expectErrorFunction(SHOULD_WORK_TYPE_STRING_ENUM, key),
      shouldWork: SHOULD_WORK_TYPE_STRING_ENUM
    };

    if (key) {
      r.property = key;
    }

    ret.push(r);
  }

  return ret;
}

function generateNegativesForArray(schema, prop, key) {
  const ret = [];
  if (typeof prop.items === 'object' && typeof prop.maxItems === 'number') {
    const d = jsf(schema);

    if (!Array.isArray(d[key])) {
      d[key] = [];
    }

    while (d[key].length <= prop.maxItems) {
      d[key].push(jsf(prop.items));
    }

    ret.push({
      valid: false,
      data: d,
      property: key,
      message: `should not pass validation for maxItems of property: ${key}`,
      expect: expectErrorFunction(SHOULD_WORK_TYPE_ARRAY_MAX_ITEMS, key),
      shouldWork: SHOULD_WORK_TYPE_ARRAY_MAX_ITEMS
    });
  }

  if (typeof prop.items === 'object' && typeof prop.minItems === 'number') {
    const d = jsf(schema);

    if (!Array.isArray(d[key])) {
      d[key] = [];
    }

    while (d[key].length >= prop.minItems && d[key].length > 0) {
      d[key].pop();
    }

    ret.push({
      valid: false,
      data: d,
      property: key,
      message: `should not pass validation for minItems of property: ${key}`,
      expect: expectErrorFunction(SHOULD_WORK_TYPE_ARRAY_MIN_ITEMS, key),
      shouldWork: SHOULD_WORK_TYPE_ARRAY_MIN_ITEMS
    });
  }

  if (typeof prop.items === 'object' && prop.uniqueItems === true) {
    const d = jsf(schema);

    if (!Array.isArray(d[key])) {
      d[key] = [];
    }

    if (!d[key].length) {
      d[key].push(jsf(prop.items));
    }

    d[key].push(d[key][0]);

    ret.push({
      valid: false,
      data: d,
      property: key,
      message: `should not pass validation for uniqueItems of property: ${key}`,
      expect: expectErrorFunction(SHOULD_WORK_TYPE_ARRAY_UNIQUE_ITEMS, key),
      shouldWork: SHOULD_WORK_TYPE_ARRAY_UNIQUE_ITEMS
    });
  }

  // generate tests for items schema
  if (typeof prop.items === 'object') {
    const itemData = generate(prop.items);

    itemData.forEach(i => {
      const d = jsf(schema);
      const sr = ps.search(d, e => Array.isArray(e[key]), { separator: '.' });
      if (sr && sr.length && sr[0]) {
        const p = sr[0].path ? sr[0].path.concat(`.${key}`) : key;
        const nd = [i.data];
        if (typeof prop.minItems === 'number') {
          const extra = _.times(prop.minItems, () => jsf(prop.items));
          nd.push(...extra);
        }
        _.set(d, p, nd);

        ret.push({
          valid: i.valid,
          data: d,
          property: key,
          message: `within array test: ${i.message}`
        });
      }
    });
  }

  return ret;
}

function generateNegativesForObject(schema, prop, key) {
  const ret = [];
  let testsForProp = generate(prop);
  testsForProp.forEach(td => {
    const d = jsf(schema);
    d[key] = td.data;
    ret.push({
      valid: td.valid,
      data: d,
      property: td.property ? `${key}.${td.property}` : key,
      message: `nested object test: ${td.message}`,
      expect: td.valid ? expectSuccessFunction : expectErrorFunction(td.shouldWork, td.property ? `${key}.${td.property}` : key)
    });
  });

  return ret;
}

function generateExtraConditions(schema, prop, key) {
  const ret = [];
  if (Array.isArray(prop.allOf) && prop.allOf.length) {
    const d = jsf(schema);
    const np = _.cloneDeep(prop);
    np.allOf.pop();
    const newObject = jsf(np);
    d[key] = newObject;
    ret.push({
      valid: false,
      data: d,
      property: key,
      message: `should not pass validation for allOf of property: ${key}`
    });
  }

  return ret;
}

function generateNegativeDetailsForType(schema, prop, key) {
  const type = prop.type;
  const ret = [];
  if (['integer', 'number', 'string', 'array', 'object'].indexOf(type) === -1) {
    return ret;
  }

  if (type === 'integer' || type === 'number') {
    ret.push(...generateNegativesForNumber(schema, prop, key));
  } else if (type === 'string') {
    ret.push(...generateNegativesForString(schema, prop, key));
  } else if (type === 'array') {
    ret.push(...generateNegativesForArray(schema, prop, key));
  } else if (type === 'object') {
    ret.push(...generateNegativesForObject(schema, prop, key));
  }
  ret.push(...generateExtraConditions(schema, prop, key));

  return ret;
}

function generateForTypes(schema) {
  const ret = [];
  const keys = schema.properties ? Object.keys(schema.properties) : [null];
  if (!keys || !keys.length) {
    return ret;
  }

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const prop = key === null ? schema : schema.properties[key];
    ret.push(...generateNegativeType(schema, prop, key));
    ret.push(...generateNegativeDetailsForType(schema, prop, key));
  }

  return ret;
}

function generateFromRequired(schema, positive = true) {
  const ret = [];
  if (!Array.isArray(schema.required) || !schema.required.length) {
    return ret;
  }

  const keys = Object.keys(schema.properties);
  const props = positive ? _.difference(keys, schema.required) : schema.required;

  if (!Array.isArray(props) || !props.length) {
    return ret;
  }

  props.forEach(prop => {
    if (typeof prop === 'string') {
      const sample = jsf(schema);
      const msg = positive ? `should work without optional property: ${prop}` : `should not work without required property: ${prop}`;
      const expect = positive ? expectSuccessFunction : expectErrorFunction(SHOULD_WORK_REQUIRED, prop);
      let object = {
        valid: positive,
        data: _.omit(sample, prop),
        message: msg,
        property: prop,
        expect
      };

      ret.push(object);
    }
  });

  return ret;
}

/**
 * Generates test data based on JSON schema
 * @param  {Object} schema Fully expanded (no <code>$ref</code>) JSON Schema
 * @return {Array} Array of test data objects
 */
function generate(schema) {
  const ret = [];
  if (!validate(schema)) {
    return ret;
  }

  const fullSample = jsf(schema);
  if (!fullSample) {
    return ret;
  }

  ret.push({
    valid: true,
    data: fullSample,
    message: 'should work with all required properties',
    expect: expectSuccessFunction
  });

  ret.push(...generateFromRequired(schema));
  ret.push(...generateFromRequired(schema, false));
  ret.push(...generateForTypes(schema));

  return ret;
}

const expectErrorFunction = (errCode, param) => (done, err, res) => {
  let { code, message, details } = res.body.error;

  expect(res.statusCode).to.be.equal(400);
  expect(code).to.be.equal(400);
  expect(message).to.be.equal('Bad Request');
  expect(details).to.be.an('array');
  expect(details[0]).to.have.property('message', errCode);
  expect(details[0]).to.have.property('param', param);

  done();
};

const expectSuccessFunction = (done, err, res) => {
  expect(res.statusCode).to.be.equal(200);

  done();
};

function generateFromNullable(schema, positive = true) {
  const ret = [];

  // Find item index using _.findIndex (thanks @AJ Richardson for comment)
  var index = _.findIndex(arr, { id: 1 });

  // Replace item at index using native splice
  arr.splice(index, 1, { id: 100, name: 'New object.' });

  const keys = _.pickBy(schema.properties, (value, key) => {
    return value.nullable;
  });

  _.keys(keys).forEach(prop => {
    const key = keys[prop];
    if (key.type === 'object') {
      return;
    }

    const sample = jsf(schema);
    const msg = positive ? `should work with null property: ${prop}` : `should not work with null property: ${prop}`;
    const expect = positive ? expectSuccessFunction : expectErrorFunction(SHOULD_WORK_REQUIRED, prop);
    let object = {
      valid: positive,
      data: sample,
      message: msg,
      property: prop,
      expect
    };
    ret.push(object);
  });

  return ret;
}

generate.getNegativeTypes = getNegativeTypes;
module.exports = generate;