import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { UserEntity } from "./user.entity";
import { ApiProperty } from "@nestjs/swagger";
import { ProjectEntity } from "./project.entity";

@Entity({ name: 'cilents' })
export class ClientEntity {
    @ApiProperty()
    @PrimaryGeneratedColumn('uuid')
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

    // 🔹 Relation: one department → many projects
    @OneToMany(() => ProjectEntity, (project) => project.client)
    projects: ProjectEntity[];
}