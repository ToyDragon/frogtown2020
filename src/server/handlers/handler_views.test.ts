import express from "express";
import { retrieveAllData } from "./handler_views";
import { IncludedData } from "../view_data";
import Services from "../services";

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

const fakePerfSession = {
  Push(_label: string) {},
  Pop() {},
};

test("Gathers nothing", (done) => {
  retrieveAllData(
    {} as Services,
    {} as express.Request,
    [],
    fakePerfSession
  ).then((gatheredData) => {
    expect(Object.keys(gatheredData).length).toBe(0);
    done();
  });
});

test("Gathers simple data", (done) => {
  retrieveAllData(
    {} as Services,
    {} as express.Request,
    [simpleExampleStringData, simpleExampleNumberData],
    fakePerfSession
  ).then((gatheredData) => {
    expect(Object.keys(gatheredData).length).toBe(2);
    expect(gatheredData[simpleExampleStringData.var]).toBe("Data A");
    expect(gatheredData[simpleExampleNumberData.var]).toBe(5);
    done();
  });
});

test("Gathers async data", (done) => {
  retrieveAllData(
    {} as Services,
    {} as express.Request,
    [delayedExampleData],
    fakePerfSession
  ).then((gatheredData) => {
    expect(Object.keys(gatheredData).length).toBe(1);
    expect(gatheredData[delayedExampleData.var]).toBe("Data C");
    done();
  });
});
