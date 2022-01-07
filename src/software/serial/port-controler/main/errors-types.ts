import { PortSpec } from "../../core/port-spec"

export type AccessDenied = {
    kind: 'Access denied'    // ie: when port is already open by other proccess
    //TODO: substitute below to 'PortSpec' instead
    portSpec: PortSpec  
    detail: Error
}
  
export type FileNotFound = {
    kind: 'File not found'   // ie: when the portPath cannot be located
    portSpec: PortSpec  
    detail: Error
}

//TODO: This type should be generalized to be used in any case scenario, or we should rename this type to "UnknownPortOpenError"
export type UnknownError = {
    kind: 'Unknown error'   // if none of cases above apply. Note: Should never occur, but I cannot garantee
    portSpec?: PortSpec  
    detail: Error | unknown  // TODO: Remove this unknown type if possible, it is here because I'm 95% certain it's a Error type and 5% it may be other thing else. But type unknown absorbs all other types
}

export type PortOpenError = AccessDenied | FileNotFound | UnknownError

//

//TODO: Implement unit test for this feature, 
export const castPortOpenError = (portSpec: PortSpec, error: unknown): PortOpenError => {
    //TODO: I'm using the rethrow technique but should be better to implement the error on the return type (ie: using ADT, etc)
    const str = String(error)
    const etc = { portSpec, detail: error as any} // TODO: remove this any type cast if possible
    if (str) {
      const str_ = str.toLowerCase()
      if (str_.includes('access denied')) {
        return {
          kind: 'Access denied',
          ...etc,
        }
      } else if (str_.includes('file not found')) {
        return {
          kind: 'File not found',
          ...etc,
        }
      } else {
        return {
          kind: 'Unknown error',
          ...etc,
        }
      }
    } else {
      throw {
        errorKind: 'File not found',
        ...etc,
      }
    }
  }

  