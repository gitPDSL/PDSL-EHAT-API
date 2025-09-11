import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, UpdateDateColumn } from "typeorm";
import { UserEntity } from "./user.entity";
import { ApiProperty } from "@nestjs/swagger";
import { ProjectEntity } from "./project.entity";

@Entity({ name: 'project_statuses' })
export class ProjectStatusEntity {
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
    @OneToMany(() => ProjectEntity, (project) => project.status)
    users: ProjectEntity[];
}