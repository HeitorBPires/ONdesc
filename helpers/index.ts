import { ApiError } from "../types";

export function isValidNumber(value: number): boolean {
  return typeof value === "number" && !isNaN(value) && isFinite(value);
}

export function splitErrors(errors: ApiError[] = []) {
  return {
    critical: errors.filter((e) => e.level === "critical"),
    warning: errors.filter((e) => e.level === "warning"),
  };
}
