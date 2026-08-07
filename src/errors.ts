export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ValidationError";
    }
}

export class NetworkError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ValidationError";
    }
}