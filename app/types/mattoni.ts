export interface Mattone {
  mattone: string;
  tipo?: 'contenitore';
  sezione?: string;
  figli?: Mattone[];
}

export interface MattoniStructure {
  firstpage: Mattone[];
  preMultipod: Mattone[];
  multipod: Mattone[];
  postMultipod: Mattone[];
}