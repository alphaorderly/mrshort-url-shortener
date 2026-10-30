import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  NotFoundException,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * 존재하지 않는 짧은 주소나 알 수 없는 경로로 들어온 페이지 요청에는
 * 프론트엔드(index.html)를 404 상태로 돌려주어 SPA 가 "찾을 수 없음" 화면을 그린다.
 * `/api` 요청은 JSON 으로 응답한다.
 */
@Catch(NotFoundException)
export class SpaNotFoundFilter implements ExceptionFilter {
  constructor(private readonly indexPath: string | null) {}

  catch(exception: NotFoundException, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    const isPage =
      (req.method === 'GET' || req.method === 'HEAD') &&
      !req.path.startsWith('/api');

    if (isPage && this.indexPath) {
      res.status(404).setHeader('Cache-Control', 'no-store');
      res.sendFile(this.indexPath);
      return;
    }
    res.status(404).json(exception.getResponse());
  }
}
