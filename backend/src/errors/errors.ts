export class ServiceError extends Error {
  public code: string;
  public status?: number;
  
  constructor(
    code: string,
    message: string,
    status?: number
  ) {
    super(message);
    this.code = code;
    this.status = status;
  }
}