export interface IToolOptions {
  interval: number;
  loopSeries: boolean;
  seriesIndex: number;
  updateData?: (() => void) | null;
}

export interface IToolResult {
  clearLoop: () => void;
}
