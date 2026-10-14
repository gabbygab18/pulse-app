export interface AgentState {
  authed: boolean;
  clockedIn: boolean;
  onBreak: boolean;
  capturing: boolean;
  sessionId: number | null;
  lastShotAt: string | null;
  queued: number;
  apiUrl: string;
  mode: 'panel' | 'island';
  user: { id: number; name: string; email: string; role: string } | null;
}

declare global {
  interface Window {
    isla: {
      getState(): Promise<AgentState>;
      onState(cb: (s: AgentState) => void): void;
      setApiUrl(url: string): Promise<string>;
      login(creds: { email: string; password: string }): Promise<AgentState['user']>;
      logout(): Promise<void>;
      clockIn(): Promise<void>;
      clockOut(): Promise<void>;
      startBreak(): Promise<void>;
      endBreak(): Promise<void>;
      openPortal(): Promise<void>;
      setMode(mode: 'panel' | 'island'): Promise<'panel' | 'island'>;
      getScreenSource(): Promise<string | null>;
      uploadRecording(buf: ArrayBuffer): Promise<void>;
    };
  }
}
