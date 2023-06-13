////////////////////////////////////////////////////////////////////////////////

import { parse as parseArgs } from "https://deno.land/std/flags/mod.ts"

import { DB } from "https://deno.land/x/sqlite/mod.ts";

import { readKeypress } from "https://deno.land/x/keypress@0.0.11/mod.ts";


////////////////////////////////////////////////////////////////////////////////

// TODO: rendering options
// TODO: routine-specific hooks (execute bash)
// TODO: routines (.config)
// TODO: allow for different frontends (esp. webapp/localhost)
// TODO: remap keys
// TODO: if you want to use envvars, pass them into the cli via --config $NOWIFY_CONFIG

const { _: args, help } = parseArgs(
  Deno.args,
  {
    default: {
      help: false,
      config: `TODO`,
    },
    boolean: [ "help" ],
    string: [ "config" ],
    alias: { h: "help", c: "config" },
  }
);

const command = args.join(` `).trim();


////////////////////////////////////////////////////////////////////////////////

// TODO: what to do if nowify db is not found? ask where to create new?
const db = new DB(`nowify.db`);

db.execute(`
  create table if not exists log
  ( created_at timestamp not null default current_timestamp
  , event text not null check (event <> '')
  , action text not null check (action in ('start','skip','more','done'))
  )
`);

db.execute(`drop table if exists routine`);
db.execute(`
  create table routine
  ( created_at timestamp not null default current_timestamp
  , id integer not null primary key autoincrement
  , event text not null check (id <> '')
  , desc text not null
  , duration int not null check (duration > 0)
  , days text not null
  , start int not null check (start between 0 and 23)
  , end int not null check (end between 0 and 23)
  )
`);

// TODO: parse .config/routine.csv
const routines = [
  {
    event: 'exercise-1',
    desc: 'Did you exercise and listen to an audiobook? (1)',
    duration: 25,
    days: 'MTWRFAU',
    start: 4,
    end: 10,
  },
  {
    event: 'exercise-2',
    desc: 'Did you exercise and listen to an audiobook? (2)',
    duration: 25,
    days: 'MTWRFAU',
    start: 10,
    end: 14,
  },
];

for (const routine of routines) {
  const cols = Object.keys(routine);
  console.log(`insert into routine (${cols.join(`,`)}) values (${cols.map(k=>':'+k).join(`,`)})`,routine);
  db.query(`insert into routine (${cols.join(`,`)}) values (${cols.map(k=>':'+k).join(`,`)})`, routine);
}

// TODO: create indexes if not exists?

// for (const name of ["Peter Parker", "Clark Kent", "Bruce Wayne"]) {
//   db.query("INSERT INTO people (name) VALUES (?)", [name]);
// }
// 
// for (const [name] of db.query("SELECT name FROM people")) {
//   console.log(name);
// }

switch (help?`help`:command) {

  case "cli":
    for await (const keypress of readKeypress()) {
      if (keypress.ctrlKey && keypress.key === 'c') break;
      console.log(keypress);
      // TODO: make sure that start of day is current timezone
      const [row] = db.query(`
        select
        from routine r
        left join log l on r.event = l.event
        where l.created_at > datetime(current_timestamp, 'start of day') 
          and TODO
        group by r.event
        order by r.id asc
      `);
    }
    break;

  case "stats":
    // TODO
    break;

  case "annoy":
    // TODO: create docs for how to run this inline like `watch -n 2 -c deno annoy.ts`
    const [t,event,action] = db.query(`select created_at, event, action from log order by created_at desc limit 1`) ?? [];
    // TODO: if no events exist, try to start a new one
    console.log(t,event,action);
    // TODO: do something more extreme than a beep if nowify hasn't been run lately
    await Deno.run({ cmd: `afplay -v 5 /System/Library/Sounds/Morse.aiff`.split(` `) }).status();
    break;

  case "export":
    // TODO
    break;

  case "server":
    // TODO
    break;

  default:
    console.log(`invalid command: '${command}'`);
  case "":
  case "help":
    console.log([
      "usage blah blah blah",
      "TODO",
      "TODO",
    ].join(`\n`));
    break;
}

db.close();