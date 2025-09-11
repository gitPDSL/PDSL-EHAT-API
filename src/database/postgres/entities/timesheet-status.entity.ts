import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, UpdateDateColumn } from "typeorm";
import { UserEntity } from "./user.entity";
import { ApiProperty } from "@nestjs/swagger";
import { TimesheetEntity } from "./timesheet.entity";

@Entity({ name: 'timesheet_statuses' })
export class TimesheetStatusEntity {
    @ApiProperty()
    @PrimaryColumn()
    id: string;
    @ApiProperty()
    @Column()
    name: string;
    @ApiProperty()
    @Column()
    description: string;
    @ApiProperty()
    @CreateDateColumn({ name: 'created_at', default: () => 'now()', type: 'timestamp' })
    createdAt: Date;
    @ApiProperty()
    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    updatedAt: Date;
    @ApiProperty()
    @ManyToOne(() => UserEntity, { nullable: true })
    @JoinColumn({ name: 'created_by' })
    createdBy: UserEntity | null;
    @ApiProperty()
    @ManyToOne(() => UserEntity, { nullable: true })
    @JoinColumn({ name: 'updated_by' })
    updatedBy: UserEntity | null;

    // One role can be assigned to many users
    @OneToMany(() => TimesheetEntity, (timesheet) => timesheet.status)
    users: TimesheetEntity[];
}