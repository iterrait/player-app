export const toCamelCase = (str: string): string =>
  str.replace(
    /(_\w)/g,
    match => match[1].toUpperCase(),
  );

export const toSnakeCase = (str: string): string =>
  // lookahead and lookbehind not working in Safari :(
  str.replace(
    /([^A-Z])([A-Z])/g,
    '$1_$2',
  ).toLowerCase();
