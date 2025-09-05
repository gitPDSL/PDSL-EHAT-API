import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class PasswordValidationPipe implements PipeTransform {
    transform(value: any) {
        if (!value) {
            throw new BadRequestException('Password is required');
        }

        const password = value.toString();

        // Example rules
        if (password.length < 8) {
            throw new BadRequestException(
                'Password must be at least 8 characters long',
            );
        }

        const hasUpperCase = /[A-Z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasSpecialChar = /[!@#$%^&*)(+=._-]/.test(password);

        if (!hasUpperCase || !hasLowerCase) {
            throw new BadRequestException(
                'Password must contain both uppercase and lowercase letters',
            );
        }

        if (!hasNumber) {
            throw new BadRequestException(
                'Password must include at least one number',
            );
        }

        if (!hasSpecialChar) {
            throw new BadRequestException(
                'Password must include at least one special character',
            );
        }

        return password;
    }
}
