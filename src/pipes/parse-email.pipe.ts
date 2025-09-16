import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseEmailPipe implements PipeTransform {
  transform(value: any) {
    if (!value) {
      throw new BadRequestException('Email is required');
    }

    const email = value.toString().trim().toLowerCase();

    // Simple Regex for validation
    const regex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!regex.test(email)) {
      throw new BadRequestException('Invalid email format');
    }

    return email; // normalized email
  }
}

@Injectable()
export class ParseOptionalEmailPipe implements PipeTransform {
  transform(value: any) {
    if (!value) {
      // throw new BadRequestException('Email is required');
      return value;
    }

    const email = value.toString().trim().toLowerCase();

    // Simple Regex for validation
    const regex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!regex.test(email)) {
      throw new BadRequestException('Invalid email format');
    }

    return email; // normalized email
  }
}
