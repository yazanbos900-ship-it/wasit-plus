export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface ErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  timestamp: string;
}

export function handleError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: ErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    timestamp: new Date().toISOString()
  }
  console.error('App Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
