import {
  HttpClient,
  HttpHeaders,
  HttpParams,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  Observable,
  throwError,
} from 'rxjs';
import {
  catchError,
  map,
  take,
} from 'rxjs/operators';
import { convertKeysToCamel, convertKeysToSnake, isArray } from '../utils/object';

export interface Headers {
  [header: string]: string | string[];
}

export interface Params {
  [key: string]: any;
}

export interface Options {
  headers?: Headers | HttpHeaders;
  params?: Params | HttpParams;

  [key: string]: any;
}

export const jsonAcceptHeader = {
  'Accept': 'application/json',
};

export const jsonHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
  ...jsonAcceptHeader,
};

@Injectable({
  providedIn: 'root',
})
export class ApiService {

  constructor(
    private http: HttpClient,
  ) { }

  protected formatErrors(response: any): Observable<never> {
    return throwError(response);
  }

  protected prepareOptions(options: Options): Options {
    const newOptions: Options = {...options};

    if (options.params) {
      newOptions.params = convertKeysToSnake({
        ...options.params,
      });
    }

    return newOptions;
  }

  protected toStringArrayParams(params: Params): Params {
    const result: Params = {};

    Object.keys(params)
      .forEach((key) => {
        const value = params[key];

        result[key] = isArray(value)
          ? value.join(',')
          : value;
      });

    return result;
  }

  get<T>(
    path: string,
    params: Params | HttpParams = {},
    options: Options = {},
  ): Observable<T> {
    params = convertKeysToSnake(params);

    return this.http.get<T>(
      path,
      {
        ...options,
        params,
      },
    ).pipe(
      map(convertKeysToCamel),
      take(1),
      catchError(this.formatErrors.bind(this)),
    );
  }

  getJson<T>(
    path: string,
    params: Params | HttpParams = {},
    options: Options = {},
  ): Observable<T> {
    return this.get<T>(
      path,
      convertKeysToSnake(params),
      this.prepareOptions({
        headers: jsonAcceptHeader,
        ...options,
      }),
    ).pipe(map(convertKeysToCamel));
  }

  put<T>(
    path: string,
    body?: object,
    options?: Options,
  ): Observable<T> {
    return this.http.put<T>(
      path,
      body,
      options,
    ).pipe(
      take(1),
      catchError(this.formatErrors.bind(this)),
    );
  }

  putJson<T>(
    path: string,
    body: object = {},
    options: Options = {},
  ): Observable<T> {
    return this.put<T>(
      path,
      convertKeysToSnake(body),
      this.prepareOptions({
        headers: jsonHeaders,
        ...options,
      }),
    ).pipe(map(convertKeysToCamel));
  }

  patch<T>(
    path: string,
    body?: object,
    options?: Options,
  ): Observable<T> {
    return this.http.patch<T>(
      path,
      body,
      options,
    ).pipe(
      take(1),
      catchError(this.formatErrors.bind(this)),
    );
  }

  patchJson<T>(
    path: string,
    body: object = {},
    options: Options = {},
  ): Observable<T> {
    return this.patch<T>(
      path,
      convertKeysToSnake(body),
      this.prepareOptions({
        headers: jsonHeaders,
        ...options,
      }),
    ).pipe(map(convertKeysToCamel));
  }

  post<T>(
    path: string,
    body?: object,
    options?: Options,
  ): Observable<T> {
    return this.http.post<T>(
      path,
      body,
      options,
    ).pipe(
      take(1),
      catchError(this.formatErrors.bind(this)),
    );
  }

  postJson<T>(
    path: string,
    body: object = {},
    options: Options = {},
  ): Observable<T> {
    return this.post<T>(
      path,
      convertKeysToSnake(body),
      this.prepareOptions({
        headers: jsonHeaders,
        ...options,
      }),
    ).pipe(map(convertKeysToCamel));
  }

  delete<T>(
    path: string,
    params: Params | HttpParams = {},
    options?: Options,
  ): Observable<T> {
    return this.http.delete<T>(
      path,
      {
        ...options,
        params,
      },
    ).pipe(
      take(1),
      catchError(this.formatErrors.bind(this)),
    );
  }

  deleteJson<T>(
    path: string,
    params: Params | HttpParams = {},
    options: Options = {},
  ): Observable<T> {
    return this.delete<T>(
      path,
      convertKeysToSnake(params),
      this.prepareOptions({
        headers: jsonAcceptHeader,
        ...options,
      }),
    ).pipe(map(convertKeysToCamel));
  }
}
