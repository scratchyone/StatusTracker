const express = require('express');
const app = express();
var { graphqlHTTP } = require('express-graphql');
var { buildSchema } = require('graphql');
let fs = require('fs');
const db = require('better-sqlite3')('main.db3', {});
var cors = require('cors');
var schema = buildSchema(fs.readFileSync('schema.graphql').toString());
const yaml = require('js-yaml');
var moment = require('moment');
var parse = require('parse-duration');
// Get document, or throw exception on error

const doc = yaml.safeLoad(fs.readFileSync('config.yaml', 'utf8'));
let configuration = doc;
configuration.trackers = configuration.trackers.map((tracker) => {
  return {
    name: tracker.name,
    time: moment.duration(parse(tracker.time)),
    private: tracker.private,
  };
});
const port = configuration.port;
// The root provides a resolver function for each API endpoint
var root = {
  statuses: ({ secret }) => {
    let res = db.prepare('SELECT * FROM tracker_data').all();
    return configuration.trackers
      .map((tracker) => {
        let private = tracker.private;
        if (tracker.private) {
          if (secret !== configuration.secret) {
            return null;
          }
        }
        let row = res.find((row) => {
          return (
            row.name === tracker.name &&
            row.timestamp > (Date.now() - tracker.time.asMilliseconds()) / 1000
          );
        });
        if (row) {
          return { private, online: true, lastSeen: row.timestamp, ...tracker };
        } else {
          return {
            private,
            online: false,
            lastSeen: row.timestamp,
            ...tracker,
          };
        }
      })
      .filter((n) => n);
  },
};
app.use(cors());
app.use(express.json());
app.post('/ping', function (req, res) {
  if (req.body.secret !== configuration.secret)
    res.send({ error: 'Invalid secret' });
  if (!configuration.trackers.find((tracker) => tracker.name == req.body.name))
    res.send({ error: 'Invalid program' });
  try {
    db.prepare('REPLACE INTO tracker_data VALUES(?, ?)').run(
      req.body.name,
      Math.ceil(Date.now() / 1000)
    );
  } catch (e) {
    res.send({ error: e.toString() });
  }
  res.send({ error: false });
});

app.use(
  '/graphql',
  graphqlHTTP((request) => {
    return {
      schema: schema,
      rootValue: root,
      graphiql: true,
    };
  })
);

app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});
