import { toCamelCase, toSnakeCase } from './strings';

export function isArray(array: any): boolean {
  return Array.isArray(array);
}

export function convertKeysToSnake(source: any): any {
  if (!source || typeof source !== 'object') {
    return source;
  }

  if (isArray(source)) {
    return source.map(convertKeysToSnake);
  }

  const result: any = {};

  Object.keys(source)
    .forEach((key) => {
      result[toSnakeCase(key)] = convertKeysToSnake(source[key]);
    });

  return result;
}

export function convertKeysToCamel(source: any): any {
  if (!source || typeof source !== 'object') {
    return source;
  }

  if (isArray(source)) {
    return source.map(convertKeysToCamel);
  }

  const result: any = {};

  Object.keys(source)
    .forEach((key: string) => {
      result[toCamelCase(key)] = convertKeysToCamel(source[key]);
    });

  return result;
}
