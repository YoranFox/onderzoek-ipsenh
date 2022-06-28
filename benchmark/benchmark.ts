import { Database } from "./dbs/database";
import { mysql } from "./dbs/mysql";
import { Postgresql } from "./dbs/postgresql";
import { createObjectCsvWriter } from "csv-writer";
import { Redis } from "./dbs/redis";
import { MongoDB } from "./dbs/mongodb";

export interface Analytics {
  duration: number;
  memory: number;
  items: number;
}

const mysqlDb = new mysql();
const postgresDb = new Postgresql();
const redis = new Redis();
const mongoDb = new MongoDB();

const csv = createCSV();

async function startBenchmark() {
  mysqlDb.startup('localhost', 3307);
  postgresDb.startup('localhost', 5432)
  await redis.startup('localhost', 6380);
  await mongoDb.startup('localhost', 27018)
  
  // await benchmark(mongoDb);
  // await benchmark(postgresDb);
  // await benchmark(mysqlDb);
  await benchmark(redis);
}

async function benchmark(db: Database, runs: number = 500) {

  // await benchmark_insert(db, runs);
  // await benchmark_select_all(db, runs, 1);
  // await benchmark_select_all(db, runs, 10);
  // await benchmark_select_all(db, runs, 50);
  await benchmark_select_one(db, runs);
  await benchmark_delete_one(db, runs);
  await benchmark_update_one(db, runs);
  await benchmark_update_all(db, runs);
}

async function benchmark_insert(db: Database, runs: number) {
  const analytics: Analytics = {
    duration: 0,
    memory: 0,
    items: 0
  }

  for(let i =0; i< runs; i++) {
    const run = await do_run(db, insert, 'insert');
    if(run) {
      addAnalytics(analytics, run);
    }
    await db.reset();
  }
  reportResult(db, 'insert', runs, analytics);
}

async function benchmark_select_all(db: Database, runs: number, inserts: number) {
  const analytics: Analytics = {
    duration: 0,
    memory: 0,
    items: 0
  }
  for(let i = 0; i < inserts; i++) {
    await db.benchmark_insert_users();
  }

  for(let i=0; i < runs; i++) {
    const run = await do_run(db, select_all, 'select_all');
    if(run) {
      addAnalytics(analytics, run);
    }
  }

  await db.reset();

  reportResult(db, 'select_all', runs, analytics);
}

async function benchmark_select_one(db: Database, runs: number) {
  const analytics: Analytics = {
    duration: 0,
    memory: 0,
    items: 0
  }
  await db.benchmark_insert_users();

  for(let i=0; i < runs; i++) {
    const run = await do_run(db, select_one, 'select_one');
    if(run) {
      addAnalytics(analytics, run);
    }
  }

  await db.reset();

  reportResult(db, 'select_one', runs, analytics);
}

async function benchmark_delete_one(db: Database, runs: number) {
  const analytics: Analytics = {
    duration: 0,
    memory: 0,
    items: 0
  }
  await db.benchmark_insert_users();

  for(let i=0; i < runs; i++) {
    const run = await do_run(db, delete_one, 'delete_one');
    if(run) {
      await db.insert_one();
      addAnalytics(analytics, run);
    }
  }

  await db.reset();

  reportResult(db, 'delete_one', runs, analytics);
}

async function benchmark_update_one(db: Database, runs: number) {
  const analytics: Analytics = {
    duration: 0,
    memory: 0,
    items: 0
  }
  await db.benchmark_insert_users();

  for(let i=0; i < runs; i++) {
    const run = await do_run(db, update_one, 'update_one');
    if(run) {
      await db.benchmark_delete_one();
      await db.insert_one();
      addAnalytics(analytics, run);
    }
  }

  await db.reset();

  reportResult(db, 'update_one', runs, analytics);
}

async function benchmark_update_all(db: Database, runs: number) {
  const analytics: Analytics = {
    duration: 0,
    memory: 0,
    items: 0
  }

  for(let i=0; i < runs; i++) {
    await db.benchmark_insert_users();
    const run = await do_run(db, update_all, 'update_all');
    if(run) {
      await db.reset();
      addAnalytics(analytics, run);
    }
  }

  await db.reset();

  reportResult(db, 'update_all', runs, analytics);
}


// MAPPED FUNCTIONS

async function insert(db: Database): Promise<number> {
  return await db.benchmark_insert_users();
}

async function select_all(db: Database): Promise<number> {
  return await db.benchmark_select_all();
}

async function select_one(db: Database): Promise<number> {
  return await db.benchmark_select_one();
}

async function delete_one(db: Database): Promise<number> {
  return await db.benchmark_delete_one();
}

async function update_one(db: Database): Promise<number> {
  return await db.benchmark_update_one();
}

async function update_all(db: Database): Promise<number> {
  return await db.benchmark_update_all();
}





async function do_run(db: Database, run_function: any, functionName: string) {
  
  var hrstart = process.hrtime(); 
  let res = 0;
  try {
    res = await run_function(db);
  }
  catch(err) {
    console.log(`${db.name}: ${functionName} | FAILED`);
    console.log(err);
    
    return;
  }


  const memoryData = process.memoryUsage();
  var hrend = process.hrtime(hrstart); 
  var duration = hrend[0] * 1000 + hrend[1] / 1000000

  console.log(`${db.name}: ${functionName} - Run complete | Memory: ${memoryData.heapUsed / 1024 / 1024} | Duration: ${duration} | Items: ${res}`);

  const analytics: Analytics = {
    duration,
    memory: memoryData.heapUsed / 1024 / 1024,
    items: res
  }

  addToCSV(db, functionName, 1, analytics)

  return analytics;
}
  
// .............................................................................
// result reporter
// .............................................................................

function reportResult(db: Database, functionName: string, runs: number, analytics: Analytics) {
  console.log('INFO -----------------------------------------------------------------------------');
  console.log('INFO %s: %s, %d items', db.name, functionName, analytics.items / runs);
  console.log('INFO Total Time for %d runs: %d ms', runs, analytics.duration);
  console.log('INFO memory avererage usage per run %s', analytics.memory / runs);
  console.log('INFO Average per run: %d ms', (analytics.duration / runs));
  console.log('INFO Average per item: %d ms', (analytics.duration / analytics.items));
  console.log('INFO -----------------------------------------------------------------------------');
}

function createCSV() {
  const dateString = new Date().toISOString();
  
  return createObjectCsvWriter({
    path: `./benchmarks/benchmark-results-${dateString}`,
    header: [
      {id: "db", title: "DATABASE"},
      {id: "benchmark", title: "BENCHMARK"},
      {id: "duration", title: "DURATION"},
      {id: "memory", title: "MEMORY"},
      {id: "items", title: "ITEMS"},
      {id: "runs", title: "RUNS"}
    ]
  });
}

function addToCSV(db: Database, benchmark: string, runs: number, analytics: Analytics) {
  csv.writeRecords(
    [
      {
        ...analytics,
        benchmark,
        runs,
        db: db.name
      }
    ]
  )
}


function addAnalytics(to_return: Analytics, to_add: Analytics) {
 to_return.duration += to_add.duration;
 to_return.items += to_add.items;
  to_return.memory += to_add.memory;
}


startBenchmark()