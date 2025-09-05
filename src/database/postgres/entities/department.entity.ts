import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('departments')
export class DepartmentEntity {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @ApiProperty()
  @Index('idx_departments_name')
  @Column({ type: 'text' })
  name: string;
  @ApiProperty()
  @Column({ type: 'text', nullable: true })
  description: string | null;
  @ApiProperty()
  @CreateDateColumn({
    type: 'timestamp',
    name: 'created_at',
    default: () => 'now()',
  })
  createdAt: Date;
  @ApiProperty()
  @UpdateDateColumn({
    type: 'timestamp',
    name: 'updated_at',
    default: () => 'now()',
  })
  updatedAt: Date;

  // 🔹 Relation: department created by a user
  @ApiProperty()
  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdBy: UserEntity | null;
  // 🔹 Relation: department updated by a user
  @ApiProperty()
  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updatedBy: UserEntity | null;

  // 🔹 Relation: one department → many users
  @OneToMany(() => UserEntity, (user) => user.department)
  users: UserEntity[];
}
