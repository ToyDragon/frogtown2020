import express from "express";
import { retrieveAllData } from "./handler_views";
import { IncludedData } from "./view_data";

const simpleExampleStringData: IncludedData = {
  var: "A",
  retriever: (_request) => {
    return new Promise((resolve) => {
      resolve("Data A");
    });
  },
};
const simpleExampleNumberData: IncludedData = {
  var: "B",
  retriever: (_request) => {
    return new Promise((resolve) => {
      resolve(5);
    });
  },
};

const delayedExampleData: IncludedData = {
  var: "C",
  retriever: (_request) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve("Data C");
      }, 10);
    });
  },
};

test("Gathers nothing", (done) => {
  retrieveAllData({} as express.Request, []).then((gatheredData) => {
    expect(Object.keys(gatheredData).length).toBe(0);
    done();
  });
});

test("Gathers simple data", (done) => {
  retrieveAllData({} as express.Request, [
    simpleExampleStringData,
    simpleExampleNumberData,
  ]).then((gatheredData) => {
    expect(Object.keys(gatheredData).length).toBe(2);
    expect(gatheredData[simpleExampleStringData.var]).toBe("Data A");
    expect(gatheredData[simpleExampleNumberData.var]).toBe(5);
    done();
  });
});

test("Gathers async data", (done) => {
  retrieveAllData({} as express.Request, [delayedExampleData]).then(
    (gatheredData) => {
      expect(Object.keys(gatheredData).length).toBe(1);
      expect(gatheredData[delayedExampleData.var]).toBe("Data C");
      done();
    }
  );
});
