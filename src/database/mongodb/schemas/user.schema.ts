import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ACCOUNT_STATUS, ACCOUNT_TYPE } from "src/constants/account.constants";
import * as bcrypt from 'bcrypt';
import { Model, Query } from "mongoose";

@Schema({
    timestamps: true
})
export class User {
    @Prop()
    firstName: string;
    @Prop()
    lastName: string;
    @Prop({ unique: true, required: [true, `'email' is required`], lowercase: true })
    email: string;
    @Prop({ select: false })
    password: string;
    @Prop({
        type: String,
        enum: Object.keys(ACCOUNT_TYPE),
        default: ACCOUNT_TYPE.USER
    })
    accountType?: ACCOUNT_TYPE;
    @Prop({
        type: String,
        enum: Object.keys(ACCOUNT_STATUS),
        default: ACCOUNT_STATUS.PENDING
    })
    status?: ACCOUNT_STATUS;
    @Prop({ default: '', select: false })
    refreshToken?: string;
    isValidPassword: (requestPassword: string) => Promise<boolean> | boolean
}
export type UserDocument = User & Document;
export type UserModelQuery = Query<any, UserDocument, IuserQueryHelpers> & IuserQueryHelpers;
export interface IuserQueryHelpers {
    byName(this: UserModelQuery, name: string): UserModelQuery;
}
export interface IUserModel extends Model<UserDocument, IuserQueryHelpers> {
    findByEmailAndPassword(email: string, password: string): Promise<any>;
}
export const USER_MODEL = User.name;

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.pre('save', function (next: Function) {
    if (this.password) {
        this.password = bcrypt.hashSync(this.password, 10);
    }
    next();
});
UserSchema.pre(['updateOne', 'findOneAndUpdate'], function (next: Function) {
    const update = this.getUpdate() as any;

    if (update.password) {
        update.password = bcrypt.hashSync(update.password, 10);
        this.setUpdate(update);
    }
    next();
});

UserSchema.pre('updateMany', function (next: Function) {
    const update = this.getUpdate() as any;
    if (update.password) {
        update.password = bcrypt.hashSync(update.password, 10);
    }
    next();
});
// UserSchema.methods.isValidPassword
UserSchema.method('isValidPassword', function (password: string) {
    return bcrypt.compareSync(password, this.password);
})
UserSchema.statics.findByEmailAndPassword = async function (email: string, password: string) {
    const user = await this.findOne({ email }).select('+password');
    if (!user) {
        return null;
    }
    if (!user.isValidPassword(password)) {
        return null;
    }
    return user;
}
UserSchema.query = {
    ...UserSchema.query,
    byName: function (name: string) {
        return this.where({ firstName: new RegExp(name, 'i') });
    }
}