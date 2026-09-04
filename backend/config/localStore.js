const fs = require('fs');
const path = require('path');
const { nanoid } = require('nanoid');

const DATA_FILE = path.join(__dirname, '..', 'data.json');

// Initial in-memory data store structure
let dbData = {
  users: [],
  medications: [],
  videos: [],
  appointments: [],
  sosalerts: [],
  caregiverpatients: [],
  medicalrecords: []
};

// Load existing data from data.json if available
if (fs.existsSync(DATA_FILE)) {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    dbData = { ...dbData, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Could not parse data.json, starting with fresh store');
  }
}

function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(dbData, null, 2));
  } catch (e) {
    // Ignore write errors in read-only environments
  }
}

function matchesFilter(item, filter = {}) {
  for (const key in filter) {
    if (filter[key] === undefined) continue;
    const filterVal = filter[key];
    const itemVal = item[key];

    if (filterVal && typeof filterVal === 'object' && filterVal.$in) {
      if (!filterVal.$in.includes(String(itemVal))) return false;
    } else if (filterVal && typeof filterVal === 'object' && filterVal.$regex) {
      const reg = new RegExp(filterVal.$regex, filterVal.$options || 'i');
      if (!reg.test(String(itemVal || ''))) return false;
    } else if (String(itemVal) !== String(filterVal)) {
      return false;
    }
  }
  return true;
}

class QueryChain {
  constructor(dataPromise) {
    this.dataPromise = Promise.resolve(dataPromise);
  }
  sort(sortObj) {
    this.dataPromise = this.dataPromise.then(list => {
      if (!Array.isArray(list)) return list;
      const copy = [...list];
      const key = Object.keys(sortObj)[0];
      const dir = sortObj[key] === -1 ? -1 : 1;
      return copy.sort((a, b) => {
        if (a[key] < b[key]) return -1 * dir;
        if (a[key] > b[key]) return 1 * dir;
        return 0;
      });
    });
    return this;
  }
  populate() {
    return this;
  }
  limit(n) {
    this.dataPromise = this.dataPromise.then(list => Array.isArray(list) ? list.slice(0, n) : list);
    return this;
  }
  select() {
    return this;
  }
  then(onFulfilled, onRejected) {
    return this.dataPromise.then(onFulfilled, onRejected);
  }
  catch(onRejected) {
    return this.dataPromise.catch(onRejected);
  }
}

function createModelWrapper(collectionName, defaultSchema = {}) {
  return class ModelInstance {
    constructor(doc = {}) {
      Object.assign(this, doc);
      if (!this._id && !this.id) {
        this._id = nanoid(24);
      }
      if (this._id && !this.id) {
        this.id = this._id;
      }
      if (!this.createdAt) {
        this.createdAt = new Date().toISOString();
      }
    }

    async save() {
      if (!this._id) this._id = nanoid(24);
      this.id = this._id;
      
      // Handle auto patientId generation for patient role
      if (collectionName === 'users' && this.role === 'patient' && !this.patientId) {
        this.patientId = nanoid(10);
      }

      const collection = dbData[collectionName];
      const idx = collection.findIndex(item => String(item._id) === String(this._id));
      const plainObj = JSON.parse(JSON.stringify(this));

      if (idx >= 0) {
        collection[idx] = plainObj;
      } else {
        collection.push(plainObj);
      }
      saveData();
      return this;
    }

    static find(filter = {}) {
      const items = dbData[collectionName].filter(item => matchesFilter(item, filter));
      return new QueryChain(items);
    }

    static findOne(filter = {}) {
      const item = dbData[collectionName].find(item => matchesFilter(item, filter));
      return new QueryChain(item ? new ModelInstance(item) : null);
    }

    static findById(id) {
      const item = dbData[collectionName].find(item => String(item._id) === String(id) || String(item.id) === String(id));
      return new QueryChain(item ? new ModelInstance(item) : null);
    }

    static async findByIdAndUpdate(id, update = {}, options = {}) {
      const item = dbData[collectionName].find(item => String(item._id) === String(id) || String(item.id) === String(id));
      if (!item) return null;
      
      const payload = update.$set ? update.$set : update;
      Object.assign(item, payload);
      saveData();
      return new ModelInstance(item);
    }

    static async findByIdAndDelete(id) {
      const idx = dbData[collectionName].findIndex(item => String(item._id) === String(id) || String(item.id) === String(id));
      if (idx === -1) return null;
      const removed = dbData[collectionName].splice(idx, 1)[0];
      saveData();
      return new ModelInstance(removed);
    }

    static async findOneAndDelete(filter = {}) {
      const idx = dbData[collectionName].findIndex(item => matchesFilter(item, filter));
      if (idx === -1) return null;
      const removed = dbData[collectionName].splice(idx, 1)[0];
      saveData();
      return new ModelInstance(removed);
    }

    static async countDocuments(filter = {}) {
      const items = dbData[collectionName].filter(item => matchesFilter(item, filter));
      return items.length;
    }

    static async deleteMany(filter = {}) {
      dbData[collectionName] = dbData[collectionName].filter(item => !matchesFilter(item, filter));
      saveData();
      return { acknowledged: true };
    }
  };
}

module.exports = {
  User: createModelWrapper('users'),
  Medication: createModelWrapper('medications'),
  Video: createModelWrapper('videos'),
  Appointment: createModelWrapper('appointments'),
  SosAlert: createModelWrapper('sosalerts'),
  CaregiverPatient: createModelWrapper('caregiverpatients'),
  MedicalRecord: createModelWrapper('medicalrecords')
};
