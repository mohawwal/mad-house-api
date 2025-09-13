import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventsService } from './events.service';

@Injectable()
export class EventsCron {
  private readonly logger = new Logger(EventsCron.name);

  constructor(private readonly eventsService: EventsService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async updateEventStatuses() {
    this.logger.log('Starting automatic event status update...');
    try {
      const result = await this.eventsService.updateEventStatuses();
      this.logger.log(
        `Event status update completed. 
        Updated to Ongoing: ${result.updatedToOngoing}, 
        Updated to Completed: ${result.updatedToCompleted}`,
      );
    } catch (error) {
      this.logger.error('Error updating event statuses:', error);
    }
  }
}
