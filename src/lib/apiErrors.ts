export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public extra?: Record<string, unknown>
  ) {
    super(message);
  }
}
