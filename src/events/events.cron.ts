import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventsService } from './events.service';

@Injectable()
export class EventsCron {
  private readonly logger = new Logger(EventsCron.name);

  // optional locks to avoid overlapping runs
  private isProcessingUpcoming = false;
  private isProcessingCompleted = false;

  constructor(private readonly eventsService: EventsService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async updateUpcomingToOngoing() {
    if (this.isProcessingUpcoming) return;
    this.isProcessingUpcoming = true;

    this.logger.log('Checking for events that should start...');
    try {
      const updatedCount = await this.eventsService.updateUpcomingToOngoing(
        new Date(),
      );
      this.logger.log(`Updated to Ongoing: ${updatedCount}`);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? `${err.message}\n${err.stack}` : String(err);
      this.logger.error(`Failed to update Upcoming→Ongoing: ${msg}`);
    } finally {
      this.isProcessingUpcoming = false;
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async updateOngoingToCompleted() {
    if (this.isProcessingCompleted) return;
    this.isProcessingCompleted = true;

    this.logger.log('Checking for events that should complete...');
    try {
      const updatedCount = await this.eventsService.updateOngoingToCompleted(
        new Date(),
      );
      this.logger.log(`Updated to Completed: ${updatedCount}`);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? `${err.message}\n${err.stack}` : String(err);
      this.logger.error(`Failed to update Ongoing→Completed: ${msg}`);
    } finally {
      this.isProcessingCompleted = false;
    }
  }
}
