import { Dimension } from './dimension';

export interface KPI {
  id: string;
  name: string;
  description: string;
  dimensions: Dimension[];
}
