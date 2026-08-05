import { describe, expect, it } from "vitest";

import { isValidHttpUrl, toApiDateTime, toDateTimeLocal } from "./dateTime";

describe("dateTime", () => {
  it("convierte datetime-local con la zona horaria del navegador", () => {
    const localValue = "2026-08-02T09:30";
    expect(toApiDateTime(localValue)).toBe(new Date(localValue).toISOString());
  });

  it("rechaza fechas vacias o invalidas", () => {
    expect(toApiDateTime("")).toBeNull();
    expect(toApiDateTime("fecha-invalida")).toBeNull();
  });

  it("convierte una fecha recibida al formato del input local", () => {
    const source = "2026-08-02T13:30:00.000Z";
    const date = new Date(source);
    const expected = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    expect(toDateTimeLocal(source)).toBe(expected);
  });

  it("acepta solamente enlaces web validos", () => {
    expect(isValidHttpUrl("https://meet.example.com/clase")).toBe(true);
    expect(isValidHttpUrl("javascript:alert(1)")).toBe(false);
    expect(isValidHttpUrl("no-es-un-enlace")).toBe(false);
  });
});
