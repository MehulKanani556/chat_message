interface ElectronAPI {
    remoteControl: {
      moveMouse: (x: number, y: number) => Promise<void>;
      click: () => Promise<void>;
      rightClick: () => Promise<void>;
      doubleClick: () => Promise<void>;
      pressKey: (key: string) => Promise<void>;
      scroll: (amount: number) => Promise<void>;
    }
  }
  
  declare global {
    interface Window {
      electron: ElectronAPI;
    }
  }
  
  export {};