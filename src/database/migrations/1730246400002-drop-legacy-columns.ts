import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * 예전 버전이 남긴 흔적을 정리한다.
 * - `shorten.deleted`: 예전에는 링크를 지울 때 행을 남기고 이 값만 true 로 바꿨다. 지금은 행을 실제로 지운다.
 *   컬럼을 없애면 지워진 링크가 되살아나므로, 먼저 그런 행을 지운다. (클릭 기록은 외래 키로 함께 지워진다)
 * - `shorten.createdAt`: 예전 링크는 생성 시각이 없어 NULL 이었다. 항상 값이 있도록 바꾼다.
 */
export class DropLegacyColumns1730246400002 implements MigrationInterface {
  name = 'DropLegacyColumns1730246400002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "shorten" WHERE "deleted" = true`);
    await queryRunner.query(`ALTER TABLE "shorten" DROP COLUMN "deleted"`);
    await queryRunner.query(
      `UPDATE "shorten" SET "createdAt" = now() WHERE "createdAt" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "shorten" ALTER COLUMN "createdAt" SET NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "shorten" ALTER COLUMN "createdAt" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "shorten" ADD COLUMN "deleted" boolean NOT NULL DEFAULT false`,
    );
  }
}
