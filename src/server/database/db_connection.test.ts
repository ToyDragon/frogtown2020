import { DatabaseConnection } from "./db_connection";
import PooledConnectionMock from "./db_poolconnection_mock";
import { setLogLevel, Level } from "../log";

setLogLevel(Level.NONE);

test("Doesn't allow multiple transactions", async (done) => {
  const fakeConnection = new DatabaseConnection(
    10000,
    "",
    new PooledConnectionMock()
  );
  expect((await fakeConnection.beginTransaction()).err).toBeNull();
  expect((await fakeConnection.beginTransaction()).err).not.toBeNull();
  done();
});

test("Allow multiple queries in transaction", async (done) => {
  const fakeConnection = new DatabaseConnection(
    10000,
    "",
    new PooledConnectionMock()
  );
  expect((await fakeConnection.beginTransaction()).err).toBeNull();
  expect(
    (await fakeConnection.query<void>("SELECT * FROM FAKETABLE", [""])).err
  ).toBeNull();
  expect(
    (await fakeConnection.query<void>("SELECT * FROM FAKETABLE", [""])).err
  ).toBeNull();
  expect((await fakeConnection.commitOrRollback()).err).toBeNull();
  done();
});

test("Allow queries outside of transactions", async (done) => {
  const fakeConnection = new DatabaseConnection(
    10000,
    "",
    new PooledConnectionMock()
  );
  expect(
    (await fakeConnection.query<void>("SELECT * FROM FAKETABLE", [""])).err
  ).toBeNull();
  expect(
    (await fakeConnection.query<void>("SELECT * FROM FAKETABLE", [""])).err
  ).toBeNull();
  done();
});

test("Doesn't allow queries after release", async (done) => {
  const fakeConnection = new DatabaseConnection(
    10000,
    "",
    new PooledConnectionMock()
  );
  expect(
    (await fakeConnection.query<void>("SELECT * FROM FAKETABLE", [""])).err
  ).toBeNull();
  expect((await fakeConnection.release()).err).toBeNull();
  expect(
    (await fakeConnection.query<void>("SELECT * FROM FAKETABLE", [""])).err
  ).not.toBeNull();
  done();
});

test("Doesn't allow closing transactions multiple times", async (done) => {
  const fakeConnection = new DatabaseConnection(
    10000,
    "",
    new PooledConnectionMock()
  );
  expect((await fakeConnection.beginTransaction()).err).toBeNull();
  expect((await fakeConnection.commitOrRollback()).err).toBeNull();
  expect((await fakeConnection.commitOrRollback()).err).not.toBeNull();
  done();
});

test("Doesn't allow transaction after release", async (done) => {
  const fakeConnection = new DatabaseConnection(
    10000,
    "",
    new PooledConnectionMock()
  );
  expect((await fakeConnection.release()).err).toBeNull();
  expect((await fakeConnection.beginTransaction()).err).not.toBeNull();
  done();
});
