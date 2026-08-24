export class AbortException extends Error {
  constructor(message = 'Operação cancelada') {
    super(message);
    this.name = 'AbortException';
  }
}

export class FormatError extends Error {
  constructor(message = 'Erro de formato') {
    super(message);
    this.name = 'FormatError';
  }
}

export class InvalidPDFException extends Error {
  constructor(message = 'Documento PDF inválido ou corrompido') {
    super(message);
    this.name = 'InvalidPDFException';
  }
}

export class PasswordException extends Error {
  constructor(message = 'Documento protegido por senha') {
    super(message);
    this.name = 'PasswordException';
  }
}

export class SessionException extends Error {
  constructor(message = 'Sessão expirada') {
    super(message);
    this.name = 'SessionException';
  }
}

export function getException(name = '') {
  switch (name) {
    case 'AbortException': return new AbortException('Abort exception');
    case 'FormatError': return new FormatError('Format error');
    case 'InvalidPDFException': return new InvalidPDFException('Invalid PDF');
    case 'PasswordException': return new PasswordException('Password exception');
    case 'SessionException': return new SessionException('Session expired');
    default: return new Error(name || 'Erro desconhecido');
  }
}

// Make them global so that existing code finds them on window
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.AbortException = AbortException;
  // @ts-ignore
  window.FormatError = FormatError;
  // @ts-ignore
  window.InvalidPDFException = InvalidPDFException;
  // @ts-ignore
  window.PasswordException = PasswordException;
  // @ts-ignore
  window.SessionException = SessionException;
  // @ts-ignore
  window.getException = getException;
}

