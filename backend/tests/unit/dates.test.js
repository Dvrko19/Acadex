const test = require("node:test");
const assert = require("node:assert/strict");
const {
  parseIsoDate,
  parseDateOnly,
  assertEndAfterStart,
  toMysqlDateTime
} = require("../../src/helpers/dates");

test("convierte una fecha ISO con zona horaria a UTC", () => {
  const date = parseIsoDate("2026-08-01T21:03:00-04:00");
  assert.equal(date.toISOString(), "2026-08-02T01:03:00.000Z");
});

test("rechaza fechas inexistentes o sin zona horaria", () => {
  assert.throws(() => parseIsoDate("2026-08-02 01:03:00"), {
    code: "INVALID_DATE"
  });
  assert.throws(() => parseIsoDate("2026-02-30T01:03:00.000Z"), {
    code: "INVALID_DATE"
  });
  assert.throws(() => parseDateOnly("2026-02-30"), {
    code: "INVALID_DATE"
  });
});

test("rechaza endDate igual o anterior a startDate", () => {
  const start = parseIsoDate("2026-08-02T01:03:00.000Z");
  const end = parseIsoDate("2026-08-02T01:02:00.000Z");
  assert.throws(() => assertEndAfterStart(start, end), {
    code: "INVALID_DATE_RANGE"
  });
});

test("convierte ISO UTC al formato DATETIME que acepta MySQL", () => {
  assert.equal(
    toMysqlDateTime("2026-08-09T04:00:00.000Z"),
    "2026-08-09 04:00:00"
  );
  assert.equal(
    toMysqlDateTime("2026-08-08T23:30:00-04:00"),
    "2026-08-09 03:30:00"
  );
  assert.equal(toMysqlDateTime(null), null);
});
