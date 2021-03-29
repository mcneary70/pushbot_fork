// Description:
//   PostgreSQL-backed Hubot brain.

"use strict";

process.on("SIGINT", () => {
  console.error("SIGINT received.");
  process.exit(130);
});

const util = require("util");
const Promise = require("bluebird");
const pg = require("pg-promise")({
  promiseLib: Promise,
});

const databaseUrl = process.env.PUSHBOT_DATABASE_URL;
const batchSize = parseInt(process.env.BATCH_SIZE || "1000");

const columnSet = new pg.helpers.ColumnSet(["type", "key", "value:json"], {
  table: "brain",
});

module.exports = function (robot) {
  if (!databaseUrl) {
    robot.logger.info("Transient brain: no DATABASE_URL specified.");
    return;
  }

  const db = (robot.postgres = pg(databaseUrl));

  robot.logger.debug("Brain connected to database at DATABASE_URL.");

  // For hubot-markov
  robot.getDatabase = function () {
    return robot.postgres;
  };

  robot.emit("database-up");

  const loadAll = function () {
    const data = {};

    let create = "CREATE TABLE IF NOT EXISTS brain (";
    create += "key TEXT, type TEXT, value JSON DEFAULT '{}'::json, ";
    create += "CONSTRAINT brain_pkey PRIMARY KEY (key, type))";

    let count = 0;

    return db
      .none(create)
      .then(() => db.any("SELECT type, key, value FROM brain"))
      .then((results) => {
        results.forEach((row) => {
          if (data[row.type] === undefined) data[row.type] = {};

          data[row.type][row.key] = row.value;
          count++;
        });
      })
      .then(() => {
        robot.brain.mergeData(data);
        robot.brain.setAutoSave(true);
        robot.logger.debug(`Loaded ${count} rows into the brain.`);

        robot.emit("brainReady");
      });
  };

  const upsertBatch = Promise.coroutine(function* (batch) {
    const statement =
      pg.helpers.insert(batch, columnSet) +
      " ON CONFLICT (type, key) DO UPDATE SET value = excluded.value";
    yield db.none(statement);
  });

  const upsertAll = Promise.coroutine(function* (data) {
    let batch = [];

    for (let type in data) {
      for (let key in data[type]) {
        try {
          JSON.stringify(data[type][key]);
        } catch (e) {
          // Circular reference most likely
          robot.logger.error(
            `Circular reference in brain: ${type} ${util.inspect(key, {
              depth: 2,
            })}`
          );
          continue;
        }

        batch.push({type, key, value: data[type][key]});

        if (batch.length >= batchSize) {
          yield upsertBatch(batch);
          batch = [];
        }
      }
    }

    if (batch.length > 0) {
      yield upsertBatch(batch);
    }
  });

  robot.brain.setAutoSave(false);
  loadAll();

  robot.brain.on("save", upsertAll);

  robot.brain.on("close", () => {
    upsertAll(robot.brain.data).then(() => {
      pg.end();
      robot.logger.debug("Brain disconnected from database.");
    });
  });
};
