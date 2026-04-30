import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

describe('AppController', () => {
    let appController: AppController;
    // Minimal PrismaService stub so DI resolves without a real database.
    const prismaMock = {
        $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    } as unknown as PrismaService;

    beforeEach(async () => {
        const app: TestingModule = await Test.createTestingModule({
            controllers: [AppController],
            providers: [
                AppService,
                { provide: PrismaService, useValue: prismaMock },
            ],
        }).compile();

        appController = app.get<AppController>(AppController);
    });

    describe('root', () => {
        it('should return "Hello World!"', () => {
            expect(appController.getHello()).toBe('Hello World!');
        });
    });

    describe('liveness', () => {
        it('returns ok', () => {
            expect(appController.liveness()).toEqual({ status: 'ok' });
        });
    });

    describe('health', () => {
        it('reports ok when all checks pass', async () => {
            const res: any = { status: jest.fn() };
            const report = await appController.health(res);
            expect(report.status).toBe('ok');
            expect(report.checks.database.status).toBe('pass');
            expect(report.checks.uploads.status).toBe('pass');
        });

        it('reports degraded + 503 when DB check fails', async () => {
            (prismaMock as any).$queryRaw.mockRejectedValueOnce(new Error('connection refused'));
            const statusFn = jest.fn();
            const res: any = { status: statusFn };
            const report = await appController.health(res);
            expect(report.status).toBe('degraded');
            expect(report.checks.database.status).toBe('fail');
            expect(statusFn).toHaveBeenCalledWith(503);
        });
    });
});
