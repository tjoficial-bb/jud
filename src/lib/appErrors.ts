export class AbortException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AbortException';
    Object.setPrototypeOf(this, AbortException.prototype);
  }
}

export class FormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FormatError';
    Object.setPrototypeOf(this, FormatError.prototype);
  }
}

export class InvalidPDFException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPDFException';
    Object.setPrototypeOf(this, InvalidPDFException.prototype);
  }
}

export class PasswordException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PasswordException';
    Object.setPrototypeOf(this, PasswordException.prototype);
  }
}

export class SessionException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SessionException';
    Object.setPrototypeOf(this, SessionException.prototype);
  }
}

export function getException(name: string): Error {
  switch (name) {
    case 'AbortException': return new AbortException('Abort exception');
    case 'FormatError': return new FormatError('Format error');
    case 'InvalidPDFException': return new InvalidPDFException('Invalid PDF');
    case 'PasswordException': return new PasswordException('Password exception');
    default: return new Error(name);
  }
}

// Make them global so that existing code still finds them on the window
if (typeof window !== 'undefined') {
  (window as any).AbortException = AbortException;
  (window as any).FormatError = FormatError;
  (window as any).InvalidPDFException = InvalidPDFException;
  (window as any).PasswordException = PasswordException;
  (window as any).SessionException = SessionException;
  (window as any).getException = getException;
}
