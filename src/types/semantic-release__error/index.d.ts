declare module "@semantic-release/error" {
  export default class SemanticReleaseError extends Error {
    name: string;
    code: string;
    details: any;
    semanticRelease: boolean;
    constructor(message: string, code: string, details: any);
  }
}
