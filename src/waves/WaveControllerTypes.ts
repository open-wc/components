export type ListenerMode =
  | 'selfUpdate'
  | 'parentUpdate'
  | 'childUpdate'
  | 'self+parentUpdate'
  | 'self+childUpdate'
  | 'parent+childUpdate'
  | 'self+parent+childUpdate';

export type ControllerMode =
  | 'waveTriggersUpdate'
  | 'forwardWave'
  | 'updateSendsWave'
  | 'waveTriggersUpdate+forwardWave'
  | 'waveTriggersUpdate+updateSendsWave'
  | 'forwardWave+updateSendsWave'
  | 'waveTriggersUpdate+forwardWave+updateSendsWave';
