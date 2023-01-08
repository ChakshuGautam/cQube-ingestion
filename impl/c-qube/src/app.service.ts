import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  createKPI(): string {
    return 'KPI created';
  }

  createDimension(dimension: Dimension): string {
    return 'Dimension created';
  }
}
