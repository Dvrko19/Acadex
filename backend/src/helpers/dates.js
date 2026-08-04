const { AppError } = require("./errors");

const ISO_WITH_TIMEZONE =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(?:Z|[+-]\d{2}:\d{2})$/;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

const invalidDate = () => {
  throw new AppError(
    "La fecha proporcionada no es valida.",
    400,
    "INVALID_DATE"
  );
};

const parseIsoDate = (value) => {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) invalidDate();
    return new Date(value.getTime());
  }

  if (typeof value !== "string") {
    invalidDate();
  }

  const parts = ISO_WITH_TIMEZONE.exec(value);
  if (!parts) invalidDate();
  const [, year, month, day, hour, minute, second = "0"] = parts;
  const maxDay = new Date(Date.UTC(Number(year), Number(month), 0)).getUTCDate();
  if (
    Number(month) < 1 ||
    Number(month) > 12 ||
    Number(day) < 1 ||
    Number(day) > maxDay ||
    Number(hour) > 23 ||
    Number(minute) > 59 ||
    Number(second) > 59
  ) {
    invalidDate();
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) invalidDate();
  return date;
};

const parseOptionalIsoDate = (value) => {
  if (value === undefined || value === null || value === "") return null;
  return parseIsoDate(value);
};

const parseDateOnly = (value) => {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || !DATE_ONLY.test(value)) invalidDate();

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    invalidDate();
  }

  return value;
};

const toIso = (value) => {
  if (value === undefined || value === null) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const toMysqlDateTime = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) invalidDate();
  return date.toISOString().slice(0, 19).replace("T", " ");
};

const serializeDateFields = (record, fields) => {
  if (!record) return record;
  const serialized = { ...record };
  for (const field of fields) {
    if (serialized[field] !== undefined && serialized[field] !== null) {
      serialized[field] = toIso(serialized[field]);
    }
  }
  return serialized;
};

const assertEndAfterStart = (startDate, endDate) => {
  if (startDate && endDate && endDate.getTime() <= startDate.getTime()) {
    throw new AppError(
      "La fecha de finalizacion debe ser posterior a la fecha de inicio.",
      400,
      "INVALID_DATE_RANGE"
    );
  }
};

module.exports = {
  parseIsoDate,
  parseOptionalIsoDate,
  parseDateOnly,
  toIso,
  toMysqlDateTime,
  serializeDateFields,
  assertEndAfterStart
};
