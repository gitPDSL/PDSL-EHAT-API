import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectEntity } from 'src/database/postgres/entities/project.entity';
import { ProjectUserEntity } from 'src/database/postgres/entities/project-user.entity';
import { MailService } from 'src/mail/mail.service';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { ProjectCapacityService } from './project-capacity.service';

const UK_TZ = 'Europe/London';

/**
 * Daily 09:00 UK sweep: for every active project, recompute remaining hours.
 * Fire a one-shot alert (email + in-app notification) to the project manager
 * and assigned users when remaining first crosses below alertThresholdHours.
 *
 * "One-shot" = we set projects.alertedAt when we send. We clear alertedAt
 * when remaining rises above the threshold again, so a re-cross fires the
 * alert again later.
 */
@Injectable()
export class ProjectCapCronService {
    private readonly logger = new Logger(ProjectCapCronService.name);

    constructor(
        @InjectRepository(ProjectEntity) private readonly projectRepository: Repository<ProjectEntity>,
        @InjectRepository(ProjectUserEntity) private readonly projectUserRepository: Repository<ProjectUserEntity>,
        private readonly capacity: ProjectCapacityService,
        private readonly mailService: MailService,
        private readonly notifications: NotificationsService,
    ) { }

    @Cron('0 9 * * *', { name: 'project.cap.threshold-alert', timeZone: UK_TZ })
    async sweep(): Promise<void> {
        this.logger.log('Project cap threshold sweep starting');
        const projects = await this.projectRepository.find({
            relations: ['manager'],
        });
        let fired = 0;
        let cleared = 0;
        for (const project of projects) {
            try {
                if (!project.allocatedHours || project.allocatedHours <= 0) continue;
                const snap = await this.capacity.snapshot(project.id);
                if (!snap) continue;
                const belowThreshold = snap.remainingHours <= snap.alertThresholdHours;
                const alreadyAlerted = !!(project as any).alertedAt;
                if (belowThreshold && !alreadyAlerted) {
                    await this.dispatch(project as any, snap);
                    (project as any).alertedAt = new Date();
                    await this.projectRepository.save(project);
                    fired++;
                } else if (!belowThreshold && alreadyAlerted) {
                    (project as any).alertedAt = null;
                    await this.projectRepository.save(project);
                    cleared++;
                }
            } catch (error: any) {
                this.logger.error(`Project ${project.id} sweep failed: ${error?.message ?? error}`, error?.stack);
            }
        }
        this.logger.log(`Project cap sweep done: ${fired} alerts fired, ${cleared} alerts cleared`);
    }

    private async dispatch(project: any, snap: { allocatedHours: number; usedHours: number; remainingHours: number; alertThresholdHours: number; }): Promise<void> {
        const recipients = await this.collectRecipients(project);
        const link = `${process.env.APP_URL ?? ''}/projects`;
        const subject = `${project.name}: ${snap.remainingHours}h remaining`;
        const body = `Project "${project.name}" has ${snap.remainingHours}h remaining of ${snap.allocatedHours}h allocated (used ${snap.usedHours}h). Threshold is ${snap.alertThresholdHours}h.`;
        for (const r of recipients) {
            try {
                if (r.email) {
                    await this.mailService.sendGeneric(
                        r.email,
                        subject,
                        body,
                        { recipientName: r.fullName ?? 'there', link },
                    );
                }
                await this.notifications.create({
                    userId: r.id,
                    type: 'project.cap.threshold',
                    title: subject,
                    body,
                    metadata: { projectId: project.id, link, ...snap },
                });
            } catch (error: any) {
                this.logger.warn(`Failed to alert ${r.id} for project ${project.id}: ${error?.message ?? error}`);
            }
        }
    }

    private async collectRecipients(project: any): Promise<{ id: string; email: string | null; fullName: string | null }[]> {
        const out: { id: string; email: string | null; fullName: string | null }[] = [];
        const seen = new Set<string>();
        if (project.manager?.id) {
            seen.add(project.manager.id);
            out.push({ id: project.manager.id, email: project.manager.email ?? null, fullName: project.manager.fullName ?? null });
        }
        const assignments = await this.projectUserRepository.find({
            where: { projectId: project.id } as any,
            relations: ['user'],
        });
        for (const a of assignments) {
            const u: any = (a as any).user;
            if (!u || seen.has(u.id) || !u.email) continue;
            seen.add(u.id);
            out.push({ id: u.id, email: u.email, fullName: u.fullName ?? null });
        }
        return out;
    }
}
