const STORAGE_KEY = "goodfood-records-v1";
const COLLECTIONS = ["customers", "foods", "orders", "promotions"];

function emptyDatabase() {
  return { customers: [], foods: [], orders: [], promotions: [] };
}

function validateCollection(collection) {
  if (!COLLECTIONS.includes(collection)) {
    throw new Error(`Unknown database collection: ${collection}`);
  }
}

export function readDatabase() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return emptyDatabase();

  const parsed = JSON.parse(saved);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Saved database has an invalid format.");
  }

  return Object.fromEntries(
    COLLECTIONS.map((collection) => [
      collection,
      Array.isArray(parsed[collection]) ? parsed[collection] : [],
    ]),
  );
}

export function writeDatabase(database) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(database));
}

export function readRecords(collection) {
  validateCollection(collection);
  return [...readDatabase()[collection]];
}

function validateRecordId(id) {
  if (typeof id !== "string" || !id.trim()) {
    throw new Error("Database records must have a non-empty string ID.");
  }
}

export function createRecord(collection, record) {
  validateCollection(collection);
  const database = readDatabase();
  createRecordInDatabase(database, collection, record);
  writeDatabase(database);
  return record;
}

export function updateRecord(collection, id, updates) {
  validateCollection(collection);
  const database = readDatabase();
  const updated = updateRecordInDatabase(database, collection, id, updates);
  writeDatabase(database);
  return updated;
}

export function deleteRecord(collection, id) {
  validateCollection(collection);
  const database = readDatabase();
  const record = deleteRecordInDatabase(database, collection, id);
  writeDatabase(database);
  return record;
}

export function saveDatabase(nextDatabase) {
  const database = readDatabase();

  for (const collection of COLLECTIONS) {
    const nextRecords = nextDatabase[collection];
    if (!Array.isArray(nextRecords)) {
      throw new Error(`Database collection must be an array: ${collection}`);
    }

    const currentRecords = database[collection];
    const hasMissingId = [...currentRecords, ...nextRecords].some(
      (record) => typeof record?.id !== "string" || !record.id.trim(),
    );
    if (hasMissingId) {
      database[collection] = nextRecords;
      continue;
    }

    const currentById = new Map(currentRecords.map((record) => [record.id, record]));
    const nextById = new Map(nextRecords.map((record) => [record.id, record]));

    for (const record of currentRecords) {
      if (!nextById.has(record.id)) deleteRecordInDatabase(database, collection, record.id);
    }
    for (const record of nextRecords) {
      const current = currentById.get(record.id);
      if (!current) createRecordInDatabase(database, collection, record);
      else if (JSON.stringify(current) !== JSON.stringify(record)) {
        updateRecordInDatabase(database, collection, record.id, record);
      }
    }
  }

  writeDatabase(database);
}

function createRecordInDatabase(database, collection, record) {
  validateRecordId(record?.id);
  if (database[collection].some((item) => item.id === record.id)) {
    throw new Error(`Record already exists in ${collection}: ${record.id}`);
  }
  database[collection].push(record);
}

function updateRecordInDatabase(database, collection, id, updates) {
  validateRecordId(id);
  const record = database[collection].find((item) => item.id === id);
  if (!record) throw new Error(`Record not found in ${collection}: ${id}`);

  const updated = { ...record, ...updates, id };
  database[collection] = database[collection].map((record) =>
    record.id === id ? updated : record,
  );
  return updated;
}

function deleteRecordInDatabase(database, collection, id) {
  validateRecordId(id);
  const record = database[collection].find((item) => item.id === id);
  if (!record) throw new Error(`Record not found in ${collection}: ${id}`);

  database[collection] = database[collection].filter((record) => record.id !== id);
  return record;
}
