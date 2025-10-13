import { HttpException } from './HttpException';

export class ResourceNotFoundException extends HttpException {
  constructor(message: string) {
    super(404, message);
    this.name = 'ResourceNotFound';
  }
}
